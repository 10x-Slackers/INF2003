# INF2003 Database Systems Project

HDB Resale Analytics and Tracker Web Application

---

## Project Scope

- HDB resale discovery and analytics
  - Interactive town map and resale price trends ([`app/page.tsx`](app/page.tsx), [`components/town-map.tsx`](components/town-map.tsx))
  - Searchable property and transaction listings ([`app/properties/`](app/properties/), [`app/transactions/`](app/transactions/))
  - Town amenities, property histories, and resale statistics ([`app/towns/`](app/towns/), [`app/properties/[id]/`](app/properties/%5Bid%5D/))
- User workflows
  - Authentication, profile management, and role-based access control ([`lib/auth/`](lib/auth/), [`lib/permissions.ts`](lib/permissions.ts))
  - Property and transaction management with search analytics for agents ([`app/properties/new/`](app/properties/new/), [`app/transactions/new/`](app/transactions/new/), [`app/search-stats/`](app/search-stats/), [`lib/collections/search-logs/`](lib/collections/search-logs/))
  - User and statistics management for administrators ([`app/admin/`](app/admin/))
  - Property bookmarks, saved search alerts, and matching transaction notifications ([`app/bookmarks/`](app/bookmarks/), [`app/alerts/`](app/alerts/), [`lib/services/alerts.ts`](lib/services/alerts.ts))
- Data platform
  - MariaDB relational data for users, properties, transactions, amenities, and notifications ([`lib/tables/`](lib/tables/))
  - MongoDB document data for alerts, statistics, town profiles, and search logs ([`lib/collections/`](lib/collections/))
  - Schema definitions under [`scripts/schema/`](scripts/schema/)
- ETL pipeline
  - Extracts, transforms, and loads datasets from [data.gov.sg](https://data.gov.sg) into MariaDB (relational data) and MongoDB (document data)
  - Pipeline stages live under [`scripts/`](scripts/) (`extract/`, `transform/`, `load/`), orchestrated by [`scripts/etl.py`](scripts/etl.py)
  - Sources:
    - Resale Flat Prices
    - Schools
    - Gyms
    - Parks
    - Region/Towns mapping
- Database benchmarking and utility scripts
  - Database benchmark runner and workloads ([`scripts/db-benchmark.py`](scripts/db-benchmark.py), [`scripts/benchmark/`](scripts/benchmark/))
  - Schema initialisation and test-user seeding ([`scripts/init_schema.sh`](scripts/init_schema.sh), [`scripts/seed_users.sh`](scripts/seed_users.sh))

## Usage

### Run with Docker (Recommended)

Start the application and database first:

```sh
docker compose up -d
```

To initialise the schemas, run the ETL pipeline, and seed test users:

```sh
DATAGOV_API_KEY=<your_key> docker compose --profile tools run --rm bootstrap
```

> [!NOTE]
> The data.gov.sg API key is optional, but rate-limiting may occur when fetching the datasets.

Then access the application at [http://localhost:3000](http://localhost:3000).
You may use the following credentials:

- Administrator user: `admin@example.com:P@ssw0rd`
- Agent user: `agent@example.com:P@ssw0rd`
- Regular user: `user@example.com:P@ssw0rd`

To stop the application and databases:

```sh
docker compose down
```

### Initialise Database Schema

```sh
pnpm init:schema
```

- Optional overrides: `MARIADB_HOST`, `MARIADB_PORT`, `MARIADB_DATABASE`, `MARIADB_USER`, `MARIADB_PASSWORD`, `MONGO_HOST`, `MONGO_PORT`, `MONGO_DATABASE`, `MONGO_USER`, `MONGO_PASSWORD`
  - Connection defaults match dev-container services, override via the `MARIADB_*` / `MONGO_*` environment variables.

### ETL Pipeline

```sh
DATAGOV_API_KEY=<your_key> uv run scripts/etl.py
```

- `DATAGOV_API_KEY` (optional)
  - [data.gov.sg API key](https://guide.data.gov.sg/developer-guide/api-overview/how-to-request-an-api-key) for the extract stage
- Override the DB connection with the `MARIADB_*` environment variables.

### Database Benchmarks

Results are written to `docs/db-benchmark.csv` and `docs/db-statistic-precompute.csv`.

```sh
uv run scripts/db-benchmark.py
```

- Run `uv run scripts/db-benchmark.py --help` for workload, duration, concurrency, repeat, and output options.
- Override the DB connections with the `MARIADB_*` and `MONGO_*` environment variables.

### Seed Test Users

Inserts one user per role (`ADMIN`, `AGENT`, `USER`) into MariaDB for testing. `USER_PASSWORD` is required.

```sh
USER_PASSWORD=P@ssw0rd pnpm seed:users
```

| Email             | Role  |
| ----------------- | ----- |
| admin@example.com | ADMIN |
| agent@example.com | AGENT |
| user@example.com  | USER  |

- Override the DB connection with the `MARIADB_*` environment variables.

## Development

### Prerequisites

- [Git](https://github.com/git-guides/install-git) (fully set-up)
- [Docker/Podman](https://docs.docker.com/engine/install/)
- [VS Code](https://code.visualstudio.com/download)
  - [Dev Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) extension

> [!WARNING]
> Do not use GitHub Desktop! All interactions (files, git, runtime, etc.) should be done through the Dev Container within VS Code.

### Installation

1. Clone the repo

   ```sh
   git clone git@github.com:10x-Slackers/INF2003.git
   ```

2. Open the repository in VS Code

   ```sh
   code INF2003/
   ```

3. Click on the "Re-open in Dev Container" prompt

4. Start working!

### Database Connection Configuration

1. MariaDB:
   - Host: `mariadb`
   - Port: `3306`
   - User: `root`
   - Password: `P@ssw0rd`
   - Database: `inf2003`
2. MongoDB:
   - Connection String: `mongodb://root:P@ssw0rd@mongo:27017/`
   - Host: `mongo`
   - Port: `27017`
   - User: `root`
   - Password: `P@ssw0rd`

## Developer Tooling

- Dev Containers
  - Standardised developer environment
- Pre-Commit
  - Run linting and formatting for all files during git commit
