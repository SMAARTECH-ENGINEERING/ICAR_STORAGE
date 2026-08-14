# ICAR Storage

Dynamic multi-room IoT environmental monitoring and relay-control system.

```
├── server/   Node.js + Express + MongoDB + Socket.IO backend (API, docs: server/README.md)
├── client/   React + Tailwind CSS admin dashboard (docs: client/README.md)
└── deploy/   AWS deployment artifacts (guide: DEPLOYMENT.md)
```

## Quick Start

```bash
# 1. Backend
cd server
cp .env.example .env   # fill in MONGODB_URI, JWT secrets, DEVICE_API_KEY, etc.
npm install
npm run dev             # http://localhost:5000

# 2. Frontend (separate terminal)
cd client
npm install
npm run dev             # http://localhost:5173
```

Open `http://localhost:5173`, register an account, and start creating rooms and devices. See [server/README.md](server/README.md) for the API reference and [client/README.md](client/README.md) for the dashboard's own docs.

## Deploying

- **Docker (local or any host):** `docker compose up --build` — see [docker-compose.yml](docker-compose.yml).
- **Frontend on Vercel, backend on AWS (free-tier-friendly):** `client/` deploys to Vercel straight from git; `server/` runs in Docker on a single EC2 instance (nginx + free Let's Encrypt TLS), with MongoDB Atlas for the database and SSM Parameter Store for secrets — see [DEPLOYMENT.md](DEPLOYMENT.md).
