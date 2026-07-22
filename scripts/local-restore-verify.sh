#!/usr/bin/env sh
set -eu
backup_path="${1:-/tmp/autoserve-development.sql}"
test -s "$backup_path"
docker compose exec -T postgres dropdb --if-exists -U autoserve autoserve_restore_check
docker compose exec -T postgres createdb -U autoserve autoserve_restore_check
docker compose exec -T postgres psql -v ON_ERROR_STOP=1 -U autoserve -d autoserve_restore_check < "$backup_path"
docker compose exec -T postgres psql -v ON_ERROR_STOP=1 -U autoserve -d autoserve_restore_check -c 'SELECT COUNT(*) FROM foundation_probes;'
docker compose exec -T postgres dropdb -U autoserve autoserve_restore_check
echo 'Restore verification passed in disposable database.'
