#!/bin/bash
# EC2 launch user-data: bootstraps a fresh Amazon Linux 2023 instance with
# everything needed to run the backend container behind an nginx reverse
# proxy. Runs once, automatically, as root, on first boot.
set -euxo pipefail

dnf update -y
dnf install -y docker git nginx augeas-libs

systemctl enable --now docker
usermod -aG docker ec2-user

# Docker Compose v2 plugin (dnf package isn't available on AL2023 yet)
mkdir -p /usr/local/lib/docker/cli-plugins
curl -SL "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64" \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

systemctl enable --now nginx

# certbot via pip (AL2023 has no certbot package); --nginx plugin edits the
# site config in place to add the TLS server block once you have a domain.
python3 -m venv /opt/certbot
/opt/certbot/bin/pip install --upgrade pip
/opt/certbot/bin/pip install certbot certbot-nginx
ln -sf /opt/certbot/bin/certbot /usr/bin/certbot

mkdir -p /opt/icar-storage
chown ec2-user:ec2-user /opt/icar-storage

echo "Bootstrap complete. Next: clone the repo into /opt/icar-storage and follow DEPLOYMENT.md." \
  > /opt/icar-storage/BOOTSTRAP_DONE
