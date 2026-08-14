#!/bin/bash
# Builds the .env used by docker-compose.prod.yml: starts from the
# non-secret template, then appends the 4 real secrets read from SSM
# Parameter Store (SecureString, decrypted here, never written to git or
# shell history). Run this on the EC2 instance itself — it relies on the
# instance's attached IAM role (see ec2-ssm-read-policy.json), not on any
# locally configured AWS credentials.
set -euo pipefail

TARGET_DIR="${1:-/opt/icar-storage}"
TEMPLATE="$TARGET_DIR/deploy/aws/env.production.template"
OUT="$TARGET_DIR/.env"

if [ ! -f "$TEMPLATE" ]; then
  echo "Template not found: $TEMPLATE" >&2
  exit 1
fi

cp "$TEMPLATE" "$OUT"

get_secret() {
  aws ssm get-parameter --name "/icar-storage/$1" --with-decryption \
    --query Parameter.Value --output text
}

{
  echo "MONGODB_URI=$(get_secret mongodb-uri)"
  echo "JWT_SECRET=$(get_secret jwt-secret)"
  echo "JWT_REFRESH_SECRET=$(get_secret jwt-refresh-secret)"
  echo "DEVICE_API_KEY=$(get_secret device-api-key)"
} >> "$OUT"

chmod 600 "$OUT"
echo "Wrote $OUT"
