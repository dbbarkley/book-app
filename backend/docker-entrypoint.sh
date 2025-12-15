#!/bin/bash
set -e

# Remove a potentially pre-existing server.pid
rm -f /app/tmp/pids/server.pid

# Wait for database to be ready (only if DATABASE_HOST is set)
if [ -n "$DATABASE_HOST" ]; then
  echo "Waiting for database..."
  until PGPASSWORD=$DATABASE_PASSWORD psql -h "$DATABASE_HOST" -U "$DATABASE_USERNAME" -d "postgres" -c '\q' 2>/dev/null; do
    >&2 echo "PostgreSQL is unavailable - sleeping"
    sleep 1
  done
  >&2 echo "PostgreSQL is up - executing command"
fi

# Execute the main container command
exec "$@"

