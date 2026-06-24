#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

MARIADB_HOST="${MARIADB_HOST:-mariadb}"
MONGO_HOST="${MONGO_HOST:-mongo}"

echo "Executing mariadb.sql against MariaDB (host=${MARIADB_HOST})..."
mysql -h "${MARIADB_HOST}" -u root -pP@ssw0rd < "${SCRIPT_DIR}/schema/mariadb.sql"
echo "MariaDB schema applied."

echo "Executing mongodb.js against MongoDB (host=${MONGO_HOST})..."
pnx -s mongosh "mongodb://root:P@ssw0rd@${MONGO_HOST}:27017/inf2003?authSource=admin" --file "${SCRIPT_DIR}/schema/mongodb.js"
echo "MongoDB schema applied."

echo "Schema initialised."
