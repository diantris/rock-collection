#!/bin/sh
# update.sh - Keeps the VM on the latest version (cron, every 5 minutes; setup-vm.sh): takes this repo's newest
# deploy files from master, pulls the images CI published, and recreates only the containers whose image or settings
# (docker-compose.yml, .env) changed. Flyway updates the database when the API starts. Prints nothing when nothing
# changed; deploys show up in `journalctl -t rock-collection`.
set -eu
cd "$(dirname "$0")"

# Safe while this script runs: git replaces files rather than rewriting them, and sh keeps reading the old one.
git pull -q --ff-only || echo "git pull failed; carrying on with the files as they are"

# Only the app's images. Postgres is updated by hand (README), so it never restarts by surprise.
out=$(docker compose pull -q api frontend 2>&1) || { echo "$out"; exit 1; }

before=$(docker compose ps -aq | sort)
out=$(docker compose up -d --remove-orphans 2>&1) || { echo "$out"; exit 1; }
if [ "$before" != "$(docker compose ps -aq | sort)" ]; then
  echo "Deployed:"
  docker compose ps --format '{{.Service}}: {{.Status}}'
  docker image prune -f > /dev/null
fi
