#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

MARIADB_HOST="${MARIADB_HOST:-mariadb}"
MARIADB_PORT="${MARIADB_PORT:-3306}"
MARIADB_USER="${MARIADB_USER:-root}"
MARIADB_PASSWORD="${MARIADB_PASSWORD:-P@ssw0rd}"
MARIADB_DATABASE="${MARIADB_DATABASE:-inf2003}"

if [ -z "${USER_PASSWORD:-}" ]; then
  echo "Usage: USER_PASSWORD=<password> $0" >&2
  echo "Set USER_PASSWORD to the password for the seeded users." >&2
  exit 1
fi

PASSWORD="${USER_PASSWORD}"

# bcrypt hash with the same cost as the app
HASH="$(node -e "console.log(require('bcryptjs').hashSync(process.argv[1], 10))" "$PASSWORD")"

echo "Seeding users into MariaDB..."

mysql \
  -h "${MARIADB_HOST}" -P "${MARIADB_PORT}" \
  -u "${MARIADB_USER}" -p"${MARIADB_PASSWORD}" \
  "${MARIADB_DATABASE}" \
  -e "
INSERT INTO users (name, email, password_hash, role) VALUES
  ('Admin', 'admin@example.com', '${HASH}', 'ADMIN'),
  ('Agent', 'agent@example.com', '${HASH}', 'AGENT'),
  ('User',   'user@example.com',  '${HASH}', 'USER')
ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), role = VALUES(role);
"

echo "Seeded 3 users (admin@example.com, agent@example.com, user@example.com)."
