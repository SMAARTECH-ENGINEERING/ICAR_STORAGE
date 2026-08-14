# Deploying ICAR Storage — Frontend on Vercel, Backend on AWS

Target architecture:

```
   Browser  ─HTTPS──▶  Vercel (client/, static build)

   Browser  ─HTTPS──▶ nginx (:80/:443) ──▶ backend container (127.0.0.1:5000) ──▶ MongoDB Atlas
                       on one EC2 instance      (server/Dockerfile)
```

- **Frontend** (`client/`) deploys straight from the git repo to **Vercel** — no S3, no CloudFront, no AWS involvement at all for the frontend. Vercel builds on every push, gives you HTTPS and a CDN for free on its Hobby plan.
- **Backend** (`server/`) runs in Docker on a **single free-tier EC2 instance** (`t3.micro`/`t2.micro`, 750 hrs/month free for 12 months), with **nginx on the host** doing TLS termination and reverse-proxying to the container. No ALB, no ECS, no Fargate — those have no free tier and are the most expensive part of a "standard" AWS deployment for an app this size.
- **Secrets** live in **SSM Parameter Store** (SecureString, always free) rather than Secrets Manager (~$0.40/secret/month).
- **Database** is **MongoDB Atlas** M0 (free forever, separate from AWS) — you just need a connection string.

This intentionally trades away auto-scaling and zero-downtime rolling deploys (what ECS+ALB would give you) for $0 AWS compute cost on the backend. Fine for a demo/small-team deployment; revisit ECS Fargate + ALB if you outgrow one instance.

The backend steps (§1–4) use the AWS CLI directly so every step is visible and scriptable — swap in the console if you prefer clicking through it. The frontend (§5) is Vercel's dashboard/CLI, not AWS.

## 0. Prerequisites

- AWS account with the CLI configured (`aws configure`) and permissions for EC2, IAM, SSM.
- A [Vercel](https://vercel.com) account (free Hobby plan is enough), with this repo's GitHub connected to it.
- A MongoDB Atlas cluster (free M0 tier) and its connection string — see [§1](#1-mongodb-atlas).
- A domain name (or subdomain) you can point at the EC2 instance's IP — needed for a real TLS certificate for the backend (browsers block a Vercel/HTTPS frontend from calling a plain-HTTP backend as "mixed content"). Any registrar works.
- Decide `<REGION>` (e.g. `us-east-1`) and note your `<ACCOUNT_ID>` (`aws sts get-caller-identity --query Account --output text`). Replace these placeholders, plus `<DOMAIN_NAME>` (from §4), throughout this guide and inside [`deploy/aws/ec2-ssm-read-policy.json`](deploy/aws/ec2-ssm-read-policy.json) and [`deploy/aws/nginx-app.conf`](deploy/aws/nginx-app.conf).

## 1. MongoDB Atlas

1. Create a free/shared M0 cluster at [cloud.mongodb.com](https://cloud.mongodb.com).
2. **Database Access** → add a user with a strong generated password.
3. **Network Access** → add the EC2 instance's IP once you have it (§2), or `0.0.0.0/0` to start and tighten later.
4. Copy the connection string (`mongodb+srv://<user>:<password>@<cluster>.mongodb.net/icar_storage?retryWrites=true&w=majority`) — this becomes the `mongodb-uri` SSM parameter in §3.

## 2. Launch the EC2 instance

```bash
# Security group: SSH from your IP only, HTTP/HTTPS from anywhere
aws ec2 create-security-group --group-name icar-storage-sg \
  --description "ICAR Storage backend" --vpc-id <VPC_ID>

aws ec2 authorize-security-group-ingress --group-id <SG_ID> \
  --protocol tcp --port 22 --cidr <YOUR_IP>/32
aws ec2 authorize-security-group-ingress --group-id <SG_ID> \
  --protocol tcp --port 80 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id <SG_ID> \
  --protocol tcp --port 443 --cidr 0.0.0.0/0

# IAM role so the instance can read secrets from SSM without any stored
# AWS credentials on disk
aws iam create-role --role-name icar-storage-ec2-role \
  --assume-role-policy-document file://deploy/aws/ec2-trust-policy.json
aws iam put-role-policy --role-name icar-storage-ec2-role \
  --policy-name SsmReadAccess --policy-document file://deploy/aws/ec2-ssm-read-policy.json
aws iam create-instance-profile --instance-profile-name icar-storage-ec2-profile
aws iam add-role-to-instance-profile \
  --instance-profile-name icar-storage-ec2-profile --role-name icar-storage-ec2-role

# Launch (t3.micro is the modern free-tier default in most regions — check
# yours, some still offer t2.micro instead)
aws ec2 run-instances \
  --image-id <AL2023_AMI_ID> \
  --instance-type t3.micro \
  --key-name <YOUR_KEY_PAIR> \
  --security-group-ids <SG_ID> \
  --iam-instance-profile Name=icar-storage-ec2-profile \
  --user-data file://deploy/aws/ec2-user-data.sh \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=icar-storage}]'
```

Look up the latest Amazon Linux 2023 AMI for your region with `aws ec2 describe-images --owners amazon --filters "Name=name,Values=al2023-ami-*-x86_64" "Name=state,Values=available" --query "sort_by(Images,&CreationDate)[-1].ImageId" --output text`.

Allocate an Elastic IP so the address survives reboots (free while attached to a running instance, small hourly charge if left unattached):

```bash
aws ec2 allocate-address --domain vpc
aws ec2 associate-address --instance-id <INSTANCE_ID> --allocation-id <ALLOCATION_ID>
```

Point your domain's A record at this Elastic IP now, so it's propagated by the time you request a certificate in §4.

`deploy/aws/ec2-user-data.sh` runs automatically on first boot and installs Docker, the Docker Compose plugin, nginx, git, and certbot. Give it a couple of minutes, then confirm with `ssh ec2-user@<ELASTIC_IP> 'cat /opt/icar-storage/BOOTSTRAP_DONE'`.

## 3. Store secrets in SSM Parameter Store

```bash
aws ssm put-parameter --name /icar-storage/mongodb-uri --type SecureString \
  --value "mongodb+srv://<user>:<password>@<cluster>.mongodb.net/icar_storage?retryWrites=true&w=majority"

aws ssm put-parameter --name /icar-storage/jwt-secret --type SecureString \
  --value "$(openssl rand -base64 48)"

aws ssm put-parameter --name /icar-storage/jwt-refresh-secret --type SecureString \
  --value "$(openssl rand -base64 48)"

aws ssm put-parameter --name /icar-storage/device-api-key --type SecureString \
  --value "$(openssl rand -hex 24)"
```

These use the default AWS-managed KMS key (`alias/aws/ssm`), which has no extra charge. Save the `device-api-key` value — it's what you'll enter in the client's Settings page (or real device firmware) as the Device API Key.

## 4. Deploy the backend code and start it

The instance needs read access to the (private) repo. Generate a dedicated deploy key on the instance and add its public half as a **read-only Deploy key** under the GitHub repo's Settings → Deploy keys:

```bash
ssh ec2-user@<ELASTIC_IP>
ssh-keygen -t ed25519 -C "icar-storage-ec2" -f ~/.ssh/id_ed25519 -N ""
cat ~/.ssh/id_ed25519.pub   # paste this into GitHub → repo Settings → Deploy keys → Add key
ssh -T git@github.com       # confirm it authenticates
```

Then clone and start the app:

```bash
git clone git@github.com:SMAARTECH-ENGINEERING/ICAR_STORAGE.git /opt/icar-storage
cd /opt/icar-storage

# Pull the 4 secrets from SSM and merge with deploy/aws/env.production.template into .env
bash deploy/aws/fetch-ssm-env.sh .

docker compose -f docker-compose.prod.yml up -d --build
curl http://127.0.0.1:5000/api/v1/health   # should return {"success":true,...}
```

Now put nginx in front of it and get a real certificate:

```bash
sudo cp deploy/aws/nginx-app.conf /etc/nginx/conf.d/icar-storage.conf
sudo sed -i 's/<DOMAIN_NAME>/your.actual.domain/' /etc/nginx/conf.d/icar-storage.conf
sudo nginx -t && sudo systemctl reload nginx

sudo certbot --nginx -d your.actual.domain   # issues a free Let's Encrypt cert,
                                              # edits the config to add the HTTPS
                                              # block, and installs a renewal timer
```

Your backend is now live at `https://your.actual.domain`.

## 5. Deploy the frontend to Vercel

**Dashboard (one-time setup):**
1. [vercel.com/new](https://vercel.com/new) → import the `SMAARTECH-ENGINEERING/ICAR_STORAGE` repo.
2. **Root Directory** → `client` (this repo is a monorepo; Vercel needs to know the app isn't at the repo root). Framework preset auto-detects as Vite.
3. **Environment Variables** → add `VITE_API_BASE_URL` = `https://your.actual.domain/api/v1` (the EC2 backend's URL from §4). Vite inlines `VITE_*` vars into the JS bundle at build time, so this must be set here, in Vercel's project settings, not left for runtime.
4. Deploy. Vercel builds with `npm run build` and serves `dist/` automatically — [`client/vercel.json`](client/vercel.json) has the SPA rewrite rule so React Router's client-side routes don't 404 on refresh.

You'll get a URL like `https://icar-storage.vercel.app` (or attach a custom domain in the project's Domains settings). Every push to the connected branch auto-deploys — no manual redeploy step, unlike the backend.

If you'd rather not go through the dashboard: `npm i -g vercel`, then from `client/`, `vercel --prod` (prompts for the same root directory / env var on first run).

## 6. Wire CORS

Update `CORS_ORIGIN` on the instance to the Vercel domain from §5:

```bash
ssh ec2-user@<ELASTIC_IP>
cd /opt/icar-storage
sed -i 's#^CORS_ORIGIN=.*#CORS_ORIGIN=https://icar-storage.vercel.app#' .env
docker compose -f docker-compose.prod.yml up -d --build
```

(Or edit `deploy/aws/env.production.template` in git and re-run `fetch-ssm-env.sh`, so it's not lost the next time you regenerate `.env`.)

Open your Vercel URL, register an account, and confirm you can create a room. A CORS error in the browser console almost always means `CORS_ORIGIN` doesn't exactly match the Vercel origin (including `https://`, no trailing slash) — and if you later attach a custom domain in Vercel, update `CORS_ORIGIN` to match it too.

## 7. Redeploying after code changes

**Backend** (manual — this is the tradeoff of skipping ECS):
```bash
ssh ec2-user@<ELASTIC_IP>
cd /opt/icar-storage
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

**Frontend:** nothing to run — Vercel redeploys automatically on every push to the connected branch. Watch progress at [vercel.com/dashboard](https://vercel.com/dashboard) or via `vercel --prod` if deploying from the CLI.

## 8. Testing locally with Docker first

Before touching AWS, confirm the images work:

```bash
docker compose up --build
```

Backend on `http://localhost:5000`, frontend on `http://localhost:8080`, a throwaway local MongoDB — this is `docker-compose.yml` (local-only). Production uses `docker-compose.prod.yml` (server only, no local mongo) plus Atlas, as above.

## 9. Environment variables reference

| Variable | Where it lives in production | Notes |
|---|---|---|
| `MONGODB_URI` | SSM Parameter Store (SecureString) | Atlas connection string |
| `JWT_SECRET`, `JWT_REFRESH_SECRET` | SSM Parameter Store (SecureString) | Generate with `openssl rand -base64 48`, never reuse across environments |
| `DEVICE_API_KEY` | SSM Parameter Store (SecureString) | Shared secret devices/the client's Settings page use to call telemetry/command endpoints |
| `CORS_ORIGIN` | [`deploy/aws/env.production.template`](deploy/aws/env.production.template) (plain, committed) | Must exactly match the Vercel URL (or custom domain) |
| Everything else in [`server/.env.example`](server/.env.example) | Same template | Non-secret tuning values (timeouts, thresholds, retention) |
| `VITE_API_BASE_URL` | Vercel project → Settings → Environment Variables | Baked in at build time; overridable at runtime via the app's Settings page without a rebuild |

## 10. Tearing it down

To stop incurring charges (mainly the Elastic IP if left unattached, and anything past the 12-month free-tier window):

```bash
aws ec2 terminate-instances --instance-ids <INSTANCE_ID>
aws ec2 release-address --allocation-id <ALLOCATION_ID>
aws ssm delete-parameter --name /icar-storage/mongodb-uri
aws ssm delete-parameter --name /icar-storage/jwt-secret
aws ssm delete-parameter --name /icar-storage/jwt-refresh-secret
aws ssm delete-parameter --name /icar-storage/device-api-key
```

Delete the Vercel project from its dashboard (Settings → Delete Project) — nothing AWS-side to clean up for the frontend. Also pause or delete the Atlas cluster if it's not needed anymore.

## 11. Troubleshooting

| Symptom | Likely cause |
|---|---|
| `curl 127.0.0.1:5000/api/v1/health` fails on the instance | Container didn't start — `docker compose -f docker-compose.prod.yml logs`; usually a missing/malformed `.env` (re-run `fetch-ssm-env.sh`) |
| `fetch-ssm-env.sh` fails with an access-denied error | Instance profile isn't attached, or `ec2-ssm-read-policy.json`'s `<REGION>`/`<ACCOUNT_ID>` placeholders weren't filled in before creating the policy |
| `certbot --nginx` fails to get a certificate | DNS A record isn't pointing at the Elastic IP yet (check `dig your.actual.domain`), or the security group isn't allowing inbound 80 from `0.0.0.0/0` |
| Browser console shows a CORS error | `CORS_ORIGIN` in `.env` on the instance doesn't match the Vercel domain exactly — check for a custom domain override too |
| Vercel serves a blank page on a route refresh (e.g. `/rooms/ROOM-X`) | [`client/vercel.json`](client/vercel.json) is missing or wasn't picked up — confirm it's in `client/` (the configured Root Directory) and committed |
| Vercel build fails | Usually "Root Directory" wasn't set to `client` in project settings, so it tried to build the monorepo root instead of the Vite app |
| Client can't reach the backend | `VITE_API_BASE_URL` was wrong in Vercel's env vars at build time; redeploy after fixing it, or override it live via the app's Settings page without a rebuild |
| "Mixed content" error blocking API calls in the browser | Frontend is HTTPS (Vercel) but backend is still plain HTTP — finish the certbot step in §4 |
| MongoDB connection refused from the instance | Atlas Network Access list doesn't include the instance's Elastic IP — see §1 |
