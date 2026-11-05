# Architecture and sprint decisions

## Scope

Implement BUILD_PLAN section 13 only: M0 + minimal M1. The supplied AGENTS.md, BUILD_PLAN.md, START_CODEX.md, and README_FIRST.md are retained verbatim. The user's explicit first-sprint request bounds the larger product plan. The checkout was empty/unborn; no prior source or user changes were removed. No issue, PR, push, Cloudflare integration, public publication, or paid resource was created.

## ADR 001: one Worker and D1

Accepted: [single Worker + D1](adr/001-single-worker-d1.md). The Cloudflare Vite plugin builds a React static SPA and Hono Worker together. Workers Static Assets handles UI history fallback; `/api` and `/api/*` always run the Worker first so missing APIs cannot return HTML accidentally. React Router is client-side; same-origin relative API calls avoid an unnecessary CORS surface.

## Boundaries

`web -> contracts, db`; `db -> contracts`; `contracts -> Zod`. Workspace source exports are compiled by Vite, not assumed to be Node-compatible published packages. Strict TypeScript checks the application, repository, test and config code. `rules-core`, `rules-dnd-2024`, and `srd-ingest` are reserved package boundaries with README-only status. They export no fake rules APIs. The future rules core must remain pure and independent of UI, storage, HTTP, or AI.

Catalog access is behind `CatalogRepository` / `createCatalogRepository`. Drizzle binds SQL parameters; the repository imposes public/demo scope, stable ID pagination, bounded page sizes, literal substring search, and latest-version selection. HTTP input and output are checked with shared Zod schemas. Bad stored JSON/schema values fail closed with a generic 500 instead of leaking invalid records or query details.

## Deliberate foundation choices

- D&D `dnd5e-2024-srd` version `5.2.1` is a **planned configuration pin**, not imported data. Its only demo asset explicitly has `origin: synthetic`.
- Synthetic definitions form a narrow versioned descriptive schema with `executable: false`. This does not pretend to implement the full asset language. Schema changes for M3/M4 will need reviewed migrations and contracts.
- Version IDs and unique `(asset_id, version_number)` pins exist now. There are no runtime writes; seed uses conflict-do-nothing. Future published-version write immutability must be enforced when mutation/publishing workflows are introduced.
- No identity tables, remote services, R2, AI providers, account integrations, or hidden auth stubs. Nonpublic records are never visible to anonymous catalog reads.
- D1 is tested in workerd through Wrangler's documented `createTestHarness`, including actual production build output. No mock database is substituted. Test-only fixture writes use the D1 binding, not an HTTP mutation endpoint.
- Drizzle Kit generates versioned SQL; Wrangler applies it locally. No interactive transactions, remote `push`, or cross-request transaction assumptions. Future character mutations require D1 batch/conditional updates, optimistic revisions and idempotency keys.
- pnpm lockfile fixes the full dependency graph; native dependency build permission is limited to esbuild/workerd. Node 24 is the supported development runtime.

## Work breakdown

1. M0/M1 foundation (this sprint): workspace, single-Worker build, catalog, local D1, verification, CI and docs.
2. M2: authentication, sessions, permission model and negative authorization tests. Choose email-provider setup explicitly.
3. M3: authoritative-source manifest, independently reviewed ingestion and browse-only corpus. No source download is part of this sprint.
4. M4 and onward: deterministic rules primitives, then a real Wizard 1→2 slice. Content import never substitutes for mechanics coverage.

## Current references

Consulted Cloudflare's [Vite setup](https://developers.cloudflare.com/workers/vite-plugin/get-started/), [Wrangler test/API reference](https://developers.cloudflare.com/workers/wrangler/api/), and [Drizzle D1 guide](https://orm.drizzle.team/docs/get-started/d1-new). Use current official docs when upgrading. Avoid preview-only APIs when a supported alternative exists.
