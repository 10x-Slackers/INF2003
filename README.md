# INF2003 Database Systems Project

> [!NOTE]
> WIP, remove this note when project is ready.

HDB Resale Analytics and Tracker Web Application

---

## Project Scope

- Database Schema definitions
  - [`scripts/schema/mariadb.sql`](scripts/schema/mariadb.sql)
  - [`scripts/schema/mongodb.js`](scripts/schema/mongodb.js)
- ETL pipeline
  - Extracts, transforms, and loads datasets from [data.gov.sg](https://data.gov.sg) into MariaDB (relational data) and MongoDB (document data)
  - Pipeline stages live under [`scripts/`](scripts/) (`extract/`, `transform/`, `load/`), orchestrated by [`scripts/etl.py`](scripts/etl.py)
  - Sources:
    - Resale Flat Prices
    - Schools
    - Gyms
    - Parks
    - Region/Towns mapping

## Usage

### Run with Docker

Start the application and database first:

```sh
docker compose up -d
```

Initialise the schemas, run the ETL pipeline, and seed test users:

```sh
DATAGOV_API_KEY=<your_key> docker compose --profile tools run --rm bootstrap
```

To stop the application and databases:

```sh
docker compose down
```

### Initialise the database schema

Applies the relational schema to MariaDB and the document schema/validation to MongoDB. Run once before the first ETL run.

```sh
pnpm init:schema
```

Connection defaults match dev-container services, override via the `MARIADB_*` / `MONGO_*` environment variables.

### Run the ETL pipeline

Extracts datasets from data.gov.sg, transforms them, and loads the results into MariaDB then MongoDB.

```sh
DATAGOV_API_KEY=<your_key> uv run scripts/etl.py
```

- `DATAGOV_API_KEY` (optional)
  - [data.gov.sg API key](https://guide.data.gov.sg/developer-guide/api-overview/how-to-request-an-api-key) for the extract stage
- Optional overrides: `MARIADB_HOST`, `MARIADB_PORT`, `MARIADB_DATABASE`, `MARIADB_USER`, `MARIADB_PASSWORD`, `MONGO_HOST`, `MONGO_PORT`, `MONGO_DATABASE`, `MONGO_USER`, `MONGO_PASSWORD`

### Seed test users

Inserts one user per role (`ADMIN`, `AGENT`, `USER`) into MariaDB for testing. `USER_PASSWORD` is required.

```sh
USER_PASSWORD=P@ssw0rd pnpm seed:users
```

| Email             | Role  |
| ----------------- | ----- |
| admin@example.com | ADMIN |
| agent@example.com | AGENT |
| user@example.com  | USER  |

Override the DB connection with the `MARIADB_*` environment variables.

## Getting Started

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

### Database Connection

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
