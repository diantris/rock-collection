#!/bin/sh
# backup.sh - Nightly database dump to the Cloud Storage bucket (cron, setup-vm.sh). The bucket deletes dumps after 30
# days by itself (README). Photos aren't in it: they live in the Pages repo; thumbnails are in the database.
set -eu
cd "$(dirname "$0")"
. ./.env
[ -n "$BACKUP_BUCKET" ] || exit 0
file=/tmp/rockdb-$(date -u +%F).dump
docker compose exec -T db pg_dump -U rockuser -Fc rockdb > "$file"
gcloud storage cp --quiet "$file" "gs://$BACKUP_BUCKET/"
rm -f "$file"
