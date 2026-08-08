#!/usr/bin/env bash
set -euo pipefail

# GluGuide Postgres backup
# Runs pg_dump against the running compose "postgres" service.
#
# Recommended cron (as root or a user with access to the repo):
#   0 3 * * * cd /root/gluguide && ./scripts/backup-db.sh >> /var/log/gluguide-backup.log 2>&1
#
# Optionally copy backups off-site, e.g. append:
#   rsync -az "$BACKUP_DIR/" user@offsite:/backups/gluguide/

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/gluguide}"
POSTGRES_USER="${POSTGRES_USER:-gluguide_user}"
POSTGRES_DB="${POSTGRES_DB:-gluguide}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"

mkdir -p "$BACKUP_DIR"
FILENAME="gluguide-$(date +%F-%H%M%S).sql.gz"

docker compose -f "$COMPOSE_FILE" exec -T postgres \
  pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" | gzip > "$BACKUP_DIR/$FILENAME"

find "$BACKUP_DIR" -name 'gluguide-*.sql.gz' -mtime "+$RETENTION_DAYS" -delete

echo "Backup written: $BACKUP_DIR/$FILENAME"
