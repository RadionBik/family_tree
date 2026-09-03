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

- `send_to_prod.sh` rsyncs the working tree (including `.env_prod` and the Google service-account key) to `~/family_tree` on the VPS; then `make prod` there.
- The VPS runs one shared Caddy (`~/web-app`, docker network `caddy-vps`) for every project. `docker-compose.prod.yml` puts the frontend container on that network; the host `~/web-app/Caddyfile` needs a `family.rbik.site { reverse_proxy family_tree_frontend:80 }` block and DNS. Nothing here binds host ports.
- Backend container runs as UID/GID 1000: bind-mounted `db_data/` and `logs/` must be writable by that user.
- The service-account key is mounted read-only via `${GOOGLE_SERVICE_ACCOUNT_FILE}`, not copied into the image (`.dockerignore` drops `*.json` and `.env*`).
- `.env_prod` is used both as compose `--env-file` (interpolation, needs `UID`/`GID`) and as the container `env_file`. A `$` inside a secret triggers "variable is not set" warnings from compose interpolation.

## Conventions

- Keep it small: no new abstraction layers, no new dependencies for what a few lines do.
- Frontend deps: minors are bumped freely; majors arrive as grouped Dependabot PRs and must pass CI.
- Auth: JWT (python-jose), token in `localStorage`, 401 from the API clears it and redirects to `/login`. Two roles exist (`admin`, `viewer`) but nothing is role-gated today.
