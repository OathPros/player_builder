# RPG Forge · foundation sprint

React SPA + Hono API in one Cloudflare Worker, local D1 via Drizzle, shared Zod contracts. **Only M0 and the smallest runnable M1 foundation are implemented.** No real SRD data, character builder, authentication, AI, or community publishing is included.

## First run

Use Node **24** (see `.node-version`) and **pnpm 11.25.0**. Install pnpm with your normal package-manager installation method, or `npm install --global pnpm@11.25.0` if permitted on your machine. No Cloudflare login, account ID, API token, or `.dev.vars` file is needed locally.

From the repository root:

```sh
pnpm install --frozen-lockfile
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Open the local address printed by Vite (port 5173). Local validation:

```sh
curl -f http://127.0.0.1:5173/api/v1/health
curl -f http://127.0.0.1:5173/api/v1/rulesets
curl -f http://127.0.0.1:5173/api/v1/assets
```

Health returns exactly `{"status":"ok","app":"rpg-forge","version":"0.1.0"}`. Rulesets returns one **planned** SRD 5.2.1 ruleset; assets returns exactly one **Synthetic Demo Spark**. This is original CC0 demonstration text, not SRD data or executable mechanics. No unauthenticated mutation endpoint exists.

All database commands above use `--local`. Local state is ignored under `apps/web/.wrangler/`. Migrate and seed may be run again: migrations are journaled; fixture IDs are stable and inserts do not overwrite existing versions. Never delete a developer’s state just to refresh the sample.

## Checks

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm db:check
pnpm exec playwright install chromium
pnpm test:e2e
```

On Linux, browser system libraries may require `pnpm exec playwright install --with-deps chromium` with OS package installation permission. `pnpm test` first builds the Worker, then runs Vitest contracts and Wrangler integration tests against that build with **isolated local D1**. Tests never use your development DB. Playwright starts the dev app and idempotently migrates/seeds its local DB; it can reuse an existing local server outside CI. `pnpm --filter @rpg-forge/web preview` runs the production build locally after `pnpm build`.

`pnpm format` formats source/config/docs; supplied planning files are preserved verbatim. `pnpm db:generate` generates a new reviewed migration from the Drizzle schema. Commit SQL and Drizzle metadata together; `db:check` checks migration history consistency. The integration tests apply the actual migrations, exercise database writes and API reads, and verify repeated seed/migration operations.

## API

- `GET /api/v1/health` — liveness and fixed version; does not prove D1 readiness.
- `GET /api/v1/rulesets?limit=20&cursor=<last-id>`
- `GET /api/v1/assets?limit=20&cursor=<last-id>&rulesetId=dnd5e-2024-srd&type=spell&q=Spark&visibility=public`

Lists return `{ data: [...], nextCursor: string | null }`. `limit` is an integer 1–50 (default 20). Omit the cursor for page one; pass `nextCursor` unchanged for the next page. Ordering is ascending stable ID; this is keyset pagination, not a snapshot across concurrent writes. Assets return the latest version once per asset. Search is a bound literal substring; SQL and LIKE wildcards are not interpreted as client syntax. Empty search should be omitted. Unknown, duplicate, malformed, unsupported, and nonpublic query parameters are rejected with 400. Only `spell` is supported in this demonstration schema.

Errors have `{ error: { code, message } }`, using `INVALID_QUERY` (400), `METHOD_NOT_ALLOWED` (405), `NOT_FOUND` (404), or `INTERNAL_ERROR` (500). API mutations receive 405 with `Allow: GET, HEAD`. Unknown API paths return JSON, never the SPA. The UI supports direct navigation, keyboard access, loading, retry, and honest empty states.

## Significant files

```text
apps/web/
  src/main.tsx, styles.css       React shell and catalog client
  worker/index.ts               Hono routes and error boundary
  vite.config.ts                Cloudflare Vite integration
  wrangler.jsonc                Local-only D1 placeholder binding
packages/
  contracts/src/                Shared Zod schemas, types, unit tests
  db/src/                       Drizzle schema and repository boundary
  db/migrations/                Generated SQLite migration + metadata
  rules-core/                   Reserved, not implemented
  rules-dnd-2024/               Reserved, not implemented
  srd-ingest/                   Reserved, not implemented
content/                        Provenance/coverage status only; no SRD corpus
tests/
  fixtures/seed.sql             One original synthetic demo
  integration/api.test.ts       Built Worker + local D1 tests
  e2e/shell.spec.ts             Browser, keyboard, responsive/error checks
docs/                           Architecture, scope, coverage, deployment
.github/workflows/ci.yml         Frozen install and verification; no deployment
```

See [architecture](docs/architecture.md), [coverage](docs/coverage.md), [deployment setup](docs/deployment.md), and [sprint verification](docs/verification.md). Future work proceeds to **M2: accounts and permissions**, followed by M3 ingestion and M4 deterministic rules. No character legality or SRD completeness claim is justified by this foundation.

## Cloudflare deployment

Nothing has been deployed or provisioned. The all-zero database ID is deliberately a local placeholder. Before an authorized deployment, configure separate dev/staging/prod D1 resources, real binding IDs and Worker names, approved migration procedures, and the Cloudflare GitHub connection. Follow [docs/deployment.md](docs/deployment.md); local development requires none of those credentials.
