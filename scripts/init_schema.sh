#!/usr/bin/env bash

set -euo pipefail

if [[ "${1:-}" == "--help" ]]; then
    sed -n '/^# init_schema/,/^$/p' "$0" | sed 's/^# \?//'
    exit 0
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

MARIADB_HOST="${MARIADB_HOST:-mariadb}"
MONGO_HOST="${MONGO_HOST:-mongo}"

echo "Executing mariadb.sql against MariaDB (host=${MARIADB_HOST})..."
mysql -h "${MARIADB_HOST}" -u root -pP@ssw0rd < "${SCRIPT_DIR}/schema/mariadb.sql"
echo "MariaDB schema applied."

echo "Executing mongodb.js against MongoDB (host=${MONGO_HOST})..."
mongosh "mongodb://root:P@ssw0rd@${MONGO_HOST}:27017/inf2003" --file "${SCRIPT_DIR}/schema/mongodb.js"
echo "MongoDB schema applied."

echo "Schema initialised."
