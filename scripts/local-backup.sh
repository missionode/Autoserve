#!/usr/bin/env sh
set -eu
output_path="${1:-/tmp/autoserve-development.sql}"
docker compose exec -T postgres pg_dump --clean --if-exists --no-owner --no-privileges -U autoserve -d autoserve > "$output_path"
test -s "$output_path"
echo "Backup written to $output_path"
