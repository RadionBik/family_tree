# Family Tree

Private family website: an interactive family tree and a list of upcoming birthdays, with birthday emails for subscribers. Russian UI.

## How it works

- A Google Sheet is the only place where family data is edited. A scheduler container re-reads it every 10 minutes and replaces the database contents.
- FastAPI + SQLite serve the data; a React SPA (family-chart) draws the tree. The whole site is behind a shared login.
- The scheduler also sends birthday emails at 08:00 UTC to subscribed addresses.

Details for working on the code (layout, commands, deploy mechanics, gotchas) are in `CLAUDE.md`.

## Run

```bash
cp .env.example .env_local   # docker dev
cp .env.example .env_prod    # docker prod
make help
```

`make dev` starts the dev stack (Vite on :5173 with hot reload). `make prod` starts the production stack. `make seed` creates the two login accounts and runs the first ingest.

## Deploy

Every merge to `main` runs CI and then deploys to the VPS over ssh (repo secrets `VPS_HOST`, `VPS_PORT`, `VPS_USER`, `VPS_SSH_KEY`). The stack publishes no host ports; the host Caddy proxies a subdomain to `family_tree_frontend:80`.

## License

GPL-3.0, see `LICENSE`.
