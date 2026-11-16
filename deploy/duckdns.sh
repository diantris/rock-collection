#!/bin/sh
# duckdns.sh - Points the DuckDNS name at the VM's current IP (DuckDNS takes the address the request comes from). The
# free IP changes only when the VM is stopped and started; cron runs this at boot and every 5 minutes (setup-vm.sh).
set -eu
cd "$(dirname "$0")"
. ./.env
[ -n "$DUCKDNS_DOMAIN" ] || exit 0
result=$(curl -fsS --max-time 30 "https://www.duckdns.org/update?domains=$DUCKDNS_DOMAIN&token=$DUCKDNS_TOKEN&ip=")
[ "$result" = OK ] || { echo "DuckDNS update failed: $result" >&2; exit 1; }
