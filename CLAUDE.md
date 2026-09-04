# Family Tree: notes for agents

Personal family website. Backend FastAPI + SQLAlchemy (async) + SQLite, frontend React + MUI + family-chart, Docker Compose deploy on a VPS. UI text is Russian; code, commits and docs are English.

## Source of truth

The SQLite database (`db_data/app.db`) is the source of truth. All writes go through `app/services/edit_service.py`, which records every change in the `changes` table (entity, kind, field, old, new, author). Write routes need the `admin` or `editor` role (`require_editor`); the shared viewer account (`privet`) only reads; user management (invites) is `admin` only. Editors come from one-time invite links (`POST /api/invites`, 7 days, `invites` table); accepting one creates the login and returns a token. Never write to the tables from anywhere else.

The Google Sheet is history. `python -m scripts.data_utils` is a one-off importer that replaces people and relations with the sheet contents; it refuses to run once `changes` has rows unless `--force` is given (that would drop every in-place edit). Sheet columns it reads: `id`, `first_name`, `last_name`, `birth_date`, `death_date`, `gender` (male/female/other), `location`, `notes`, `mother_id`, `father_id`, `spouse_id`, `marriage_date`, `divorce_date`, plus `TEXT_COLUMNS`. Its `id` column is a formula `CONCATENATE(last_name, first_name, number)`.

New person fields = model column + alembic migration + `MemberFields` in `app/schemas/family.py` + details panel in `FamilyTree.jsx` (+ `TEXT_COLUMNS` if the importer should read it).

The scheduler keeps last-run dates in `db_data/scheduler_state.json`; delete the key to force a re-run. Photos: `POST /api/family/members/{id}/photo` resizes to 1600px JPEG into `db_data/photos/<id>.jpg` and sets `photo_url` to `/api/photos/<id>.jpg?v=<mtime>`. `GET /api/photos/*` accepts the bearer token or the `token` cookie that login sets with path `/api/photos`, so `<img>` tags work. Backups: `scripts/backup_db.py` runs daily from the scheduler (`VACUUM INTO db_data/backups/app-YYYY-MM-DD.db`, 30 kept). Restore = stop the stack, copy a backup over `db_data/app.db`, start.

## Layout

- `app/api/*`: routes. Everything under `/api` needs a bearer token (`get_current_active_user`); `/` is the health check.
- `app/services/*`: `edit_service` is the write path with the change log; `family_service` reads; `birthday_service` does date math in Python (family-sized data, fine).
- `app/models/*`, `migrations/versions/*`: schema. Alembic owns the schema; `alembic upgrade head` runs in `docker-entrypoint.sh`.
- `scripts/`: `seed_db.py` (login accounts from env), `backup_db.py`, `send_birthday_notifications.py`, `data_utils.py` (one-off sheet import).
- `frontend/src/components/FamilyTreeGraph.jsx`: family-chart wrapper. `utils/chartData.js`: API members -> chart data (parents/spouses/children arrays, marriage years).
- `tests/test_smoke.py`: the only test (access rules, write path + change log, backup, sheet parsing). Run `make test` or `python -m tests.test_smoke`. Extend it rather than adding a framework.

## Commands

`make help`. Lint = pre-commit (ruff for Python, eslint + prettier for JS); CI runs the same plus `npm run build`. Ruff pin is `0.11.13` (`.pre-commit-config.yaml`, `ci.yml`); `migrations/versions` is excluded.

## Deploy

- `deploy` job in `.github/workflows/ci.yml`: on push to `main` after CI, builds both images on the runner, ships them with `docker save | ssh docker load`, rsyncs the tree (`.rsync-filter` protects server-side `.env*`, `*.json`, `db_data/`, `logs/`) and runs `make prod` (`docker compose up -d`, no build). Secrets: `VPS_HOST`, `VPS_PORT`, `VPS_USER`, `VPS_SSH_KEY`. `send_to_prod.sh` is the manual equivalent.
- The host runs one shared Caddy on docker network `caddy-vps`; `docker-compose.prod.yml` attaches the frontend to it. The host Caddyfile needs `<subdomain> { reverse_proxy family_tree_frontend:80 }`.
- Backend container runs as UID/GID 1000; the bind-mounted `db_data/` must be writable by it. Logs go to stdout only (`docker logs`). `.env_prod` and the service-account key exist only on the server (`.dockerignore` drops `.env*`, `*.json`; the key is mounted read-only via `${GOOGLE_SERVICE_ACCOUNT_FILE}`).
- `.env_prod` is both compose `--env-file` (needs `UID`/`GID`) and container `env_file`; a `$` inside a secret triggers compose interpolation warnings.

## Conventions

- Keep it small: no new abstraction layers, no new dependencies for what a few lines do.
- Frontend deps: minors are bumped freely; majors arrive as grouped Dependabot PRs and must pass CI.
- Auth: JWT (python-jose), token in `localStorage`, 401 from the API clears it and redirects to `/login`. Two roles exist (`admin`, `viewer`) but nothing is role-gated today.
