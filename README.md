# Family Tree

Private family website: an interactive family tree and a list of upcoming birthdays, with birthday emails for subscribers. Russian UI.

## How it works

- The SQLite database is the source of truth. Relatives get one-time invite links from the admin, log in and edit people, relations and photos directly; every edit is recorded in a change log that the site shows.
- FastAPI serves the data; a React SPA (family-chart) draws the tree. The whole site is behind a shared login.
- A scheduler container sends birthday emails at 08:00 UTC and writes a daily database backup to `db_data/backups/`.
- The Google Sheet that held the data before is only a one-off import now (`python -m scripts.data_utils`).

Details for working on the code (layout, commands, deploy mechanics, gotchas) are in `CLAUDE.md`.

## Run

```bash
cp .env.example .env_local   # docker dev
cp .env.example .env_prod    # docker prod
make help
```

`make dev` starts the dev stack (Vite on :5173 with hot reload). `make prod` starts the production stack. `make seed` creates the two login accounts.

## Deploy

Every merge to `main` runs CI and then deploys to the VPS over ssh (repo secrets `VPS_HOST`, `VPS_PORT`, `VPS_USER`, `VPS_SSH_KEY`). The stack publishes no host ports; the host Caddy proxies a subdomain to `family_tree_frontend:80`.

## License

GPL-3.0, see `LICENSE`.
