#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

MARIADB_HOST="${MARIADB_HOST:-mariadb}"
MARIADB_PORT="${MARIADB_PORT:-3306}"
MARIADB_USER="${MARIADB_USER:-root}"
MARIADB_PASSWORD="${MARIADB_PASSWORD:-P@ssw0rd}"

MONGO_PORT="${MONGO_PORT:-27017}"
MONGO_USER="${MONGO_USER:-root}"
MONGO_PASSWORD="${MONGO_PASSWORD:-P@ssw0rd}"
MONGO_HOST="${MONGO_HOST:-mongo}"

echo "Executing mariadb.sql against MariaDB..."
mysql -h "${MARIADB_HOST}" -u ${MARIADB_USER} -p${MARIADB_PASSWORD} < "${SCRIPT_DIR}/schema/mariadb.sql"
echo "MariaDB schema applied."

echo "Executing mongodb.js against MongoDB..."
npx -- mongosh "mongodb://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_HOST}:${MONGO_PORT}/inf2003?authSource=admin" --file "${SCRIPT_DIR}/schema/mongodb.js"
echo "MongoDB schema applied."

echo "Schema initialised."
