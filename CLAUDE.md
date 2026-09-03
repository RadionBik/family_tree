# Family Tree: notes for agents

Personal family website. Backend FastAPI + SQLAlchemy (async) + SQLite, frontend React + MUI + family-chart, Docker Compose deploy on a VPS. UI text is Russian; code, commits and docs are English.

## Source of truth

The Google Sheet is the only editable data source. `scripts/data_utils.py` (`parse_rows`, `process_family_data`) wipes and reloads `family_members` and `relations` in one transaction every 10 minutes from `run_scheduler.py`. Never add write endpoints for member data: anything written to the DB is overwritten on the next run. The admin CRUD was removed for this reason.

Sheet columns: required `id`, `first_name`; optional `last_name`, `birth_date`, `death_date`, `gender` (male/female/other), `location`, `notes`, `mother_id`, `father_id`, `spouse_id`, `marriage_date`, `divorce_date`, and the text columns listed in `TEXT_COLUMNS` in `scripts/data_utils.py`. Dates in any format `parse_sheet_date` accepts. New person fields = new sheet column + model column + alembic migration + `TEXT_COLUMNS` + `FamilyMemberRead` + details panel in `FamilyTree.jsx`.

## Layout

- `app/api/*`: routes. Everything under `/api` needs a bearer token (`get_current_active_user`); `/` is the health check.
- `app/services/*`: queries. `birthday_service` does date math in Python (family-sized data, fine).
- `app/models/*`, `migrations/versions/*`: schema. Alembic owns the schema; `alembic upgrade head` runs in `docker-entrypoint.sh`.
- `scripts/`: ingest, seed (`seed_db.py` creates `admin` and the shared viewer account from env), birthday emails.
- `frontend/src/components/FamilyTreeGraph.jsx`: family-chart wrapper. `utils/chartData.js`: API members -> chart data (parents/spouses/children arrays, marriage years).
- `tests/test_smoke.py`: the only test. Run `make test` or `python -m tests.test_smoke`. Extend it rather than adding a framework.

## Commands

`make help`. Lint = pre-commit (ruff for Python, eslint + prettier for JS); CI runs the same plus `npm run build`. Ruff pin is `0.11.13` (`.pre-commit-config.yaml`, `ci.yml`); `migrations/versions` is excluded.

## Deploy

- `deploy` job in `.github/workflows/ci.yml`: on push to `main` after CI, builds both images on the runner, ships them with `docker save | ssh docker load`, rsyncs the tree (`.rsync-filter` protects server-side `.env*`, `*.json`, `db_data/`, `logs/`) and runs `make prod` (`docker compose up -d`, no build). Secrets: `VPS_HOST`, `VPS_PORT`, `VPS_USER`, `VPS_SSH_KEY`. `send_to_prod.sh` is the manual equivalent.
- The host runs one shared Caddy on docker network `caddy-vps`; `docker-compose.prod.yml` attaches the frontend to it. The host Caddyfile needs `<subdomain> { reverse_proxy family_tree_frontend:80 }`.
- Backend container runs as UID/GID 1000; bind-mounted `db_data/` and `logs/` must be writable by it. `.env_prod` and the service-account key exist only on the server (`.dockerignore` drops `.env*`, `*.json`; the key is mounted read-only via `${GOOGLE_SERVICE_ACCOUNT_FILE}`).
- `.env_prod` is both compose `--env-file` (needs `UID`/`GID`) and container `env_file`; a `$` inside a secret triggers compose interpolation warnings.

## Conventions

- Keep it small: no new abstraction layers, no new dependencies for what a few lines do.
- Frontend deps: minors are bumped freely; majors arrive as grouped Dependabot PRs and must pass CI.
- Auth: JWT (python-jose), token in `localStorage`, 401 from the API clears it and redirects to `/login`. Two roles exist (`admin`, `viewer`) but nothing is role-gated today.
