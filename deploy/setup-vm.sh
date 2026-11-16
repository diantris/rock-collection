#!/bin/sh
# setup-vm.sh - One-time setup of a fresh Debian 12 VM (README.md): swap, Docker, the .env file, cron jobs. Run from
# this directory:   sudo sh setup-vm.sh
# Safe to run again (e.g. after new cron jobs were added here); it never overwrites an existing .env.
set -eu
cd "$(dirname "$0")"
DIR=$(pwd)
OWNER=${SUDO_USER:-$(id -un)}

# 1 GB of RAM: swap absorbs peaks (photo uploads, startup) instead of the kernel killing a container...
if [ ! -f /swapfile ]; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi
# ...but only for peaks: with Debian's default (60) the kernel swaps the idle app out to keep disk cache, and the
# first page load after a quiet night waits seconds on the slow disk (measured on the same VM type for another app).
echo 'vm.swappiness=10' > /etc/sysctl.d/99-rock-collection.conf
sysctl -q -p /etc/sysctl.d/99-rock-collection.conf

if ! command -v docker > /dev/null; then
  curl -fsSL https://get.docker.com | sh
fi
usermod -aG docker "$OWNER"

# The settings file, readable only by its owner, with a generated database password.
if [ ! -f .env ]; then
  password=$(tr -dc 'a-zA-Z0-9' < /dev/urandom | head -c 32)
  sed "s/^POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=$password/" .env.example > .env
  chown "$OWNER" .env
  chmod 600 .env
fi

# Through sh, so the scripts run whether or not they're executable.
cat > /etc/cron.d/rock-collection <<CRON
@reboot $OWNER sleep 30 && sh $DIR/duckdns.sh 2>&1 | logger -t rock-collection
*/5 * * * * $OWNER sh $DIR/duckdns.sh 2>&1 | logger -t rock-collection
*/5 * * * * $OWNER flock -n /tmp/rock-collection-update.lock sh $DIR/update.sh 2>&1 | logger -t rock-collection
30 3 * * * $OWNER sh $DIR/backup.sh 2>&1 | logger -t rock-collection
CRON

echo "Done. Next: nano $DIR/.env (DuckDNS, GitHub token, bucket), then log out and back in (for Docker)."
