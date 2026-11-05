# Foundation sprint verification

Verified in the cloud workspace on 2026-11-05. Scope: BUILD_PLAN section 13 (M0 + minimal M1). No real SRD corpus, character system, auth, AI, external account integration, paid resource, remote database write, or deployment was performed.

## Actual commands and results

| Command                                                              | Result                                                                                                            |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `pnpm install`                                                       | Passed; workspace dependencies installed and locked                                                               |
| `pnpm install --frozen-lockfile`                                     | Passed again with the final lockfile                                                                              |
| `pnpm db:generate`                                                   | Passed; generated the three-table SQL migration and Drizzle metadata                                              |
| `pnpm db:migrate && pnpm db:seed && pnpm db:migrate && pnpm db:seed` | Passed; local D1 only, second migration reports none pending, seed remains one ruleset/asset/version              |
| `pnpm db:check`                                                      | Passed; Drizzle migration history consistency                                                                     |
| `pnpm typecheck`                                                     | Passed with final dependency versions                                                                             |
| `pnpm lint`                                                          | Passed; ESLint and Prettier                                                                                       |
| `pnpm test`                                                          | Passed: 33 tests across 2 files (8 contracts + 25 Worker/D1 integration cases); includes a production build first |
| `pnpm build`                                                         | Passed for Worker and React client; latest run used Vite 8.3.6                                                    |
| `pnpm exec playwright install chromium`                              | Passed; local browser installed                                                                                   |
| `pnpm test:e2e`                                                      | Passed: all 5 Chromium tests                                                                                      |
| `pnpm dev`                                                           | Running locally on port 5173 at handoff; processes may need restarting in future sessions                         |
| Local `curl -f` requests to health and assets                        | Passed; exact health schema and exactly one non-executable synthetic spell returned                               |
| `pnpm audit --prod`                                                  | Passed: no known production dependency vulnerabilities                                                            |
| `pnpm audit`                                                         | Two moderate development-only transitive findings remain; zero high/critical; see security.md                     |

The 25 integration cases run the **built Worker in workerd** using Wrangler `createTestHarness` and fresh isolated D1. They validate real migration/seed, a database write/read path, seed idempotency, literal substring search, stable pagination, latest-version selection, foreign keys, private/campaign/draft exclusion, malformed/duplicate query rejection, mutation rejection, SPA deep-link delivery, API JSON 404s and stable missing-schema errors. A second harness verifies failure behavior without damaging the main test database. These are not mocked-database tests.

Browser checks cover keyboard skip link, route focus, synthetic catalog display, search and no-match states, Characters placeholder, direct reload, visible API failures and retry recovery. Home, Library, Characters and Attribution are checked at 320/768/1440px for horizontal overflow and CSS-clipped substantive text. This is useful accessibility evidence, not a complete WCAG audit or cross-browser certification.

## Corrections made during validation

- Removed an incorrect root-level Vite type reference; app package dependencies remain scoped to the workspace.
- Replaced a failing SQL LIKE escape expression with bound SQLite `instr(lower(name), lower(query))` substring search. Wildcard/SQL-like input is tested as literal data.
- Preserved initial browser focus order so the first Tab reaches the skip link; client-side route changes still focus the new heading.
- Upgraded initial older router/build/test/lint selections after auditing. Final graph uses React Router 8.5.1, Vite 8.3.6, Vitest 5.1.0 and ESLint 10.14.0. Two remaining development-only advisories are documented, not suppressed.

## File and safety review

The initial checkout had no commits or source files. All sprint files are new and remain uncommitted for review. The four supplied planning files are preserved verbatim. Dependency/build outputs, local database files, test-run output and secrets are ignored. A scan of new text files for common GitHub/AWS/private-key credential patterns returned no matches; this is not a guarantee against every possible credential format.

Significant tree:

```text
apps/web/{src,worker,vite.config.ts,wrangler.jsonc}
packages/contracts/src/{index.ts,index.test.ts}
packages/db/{src,drizzle.config.ts,migrations}
packages/{rules-core,rules-dnd-2024,srd-ingest}/  # reserved only
content/{sources,srd-5.2.1}/                    # status docs only
tests/{fixtures/seed.sql,integration/api.test.ts,e2e/shell.spec.ts}
docs/{architecture,data-model,rules-contracts,source-provenance,
      security,legal-attribution,coverage,deployment,verification}.md
docs/adr/001-single-worker-d1.md
docs/screenshots/home-{320,768,1440}.png
.github/workflows/ci.yml
package.json, pnpm-workspace.yaml, pnpm-lock.yaml, tsconfig.json
AGENTS.md, BUILD_PLAN.md, START_CODEX.md, README_FIRST.md, README.md
```

Screenshots: [mobile](screenshots/home-320.png), [tablet](screenshots/home-768.png), [desktop](screenshots/home-1440.png). Home screenshots were visually inspected at mobile and desktop sizes.

## Remaining work and deployment prerequisites

Real SRD ingestion/review/mechanical mapping/testing are **not started**. Character creation/persistence, accounts/permissions, rules engine, AI, uploads, publishing and production hardening are **not implemented**. Reserved packages do not contain fake implementations. Next milestone: M2 accounts and permissions, with an explicit email-provider decision and negative ownership tests, before M3 ingestion.

The GitHub CI workflow exists but has not run on GitHub; no push or PR was created. Deployment needs authorized Cloudflare account/repository access, separate dev/staging/prod Worker and D1 configuration with actual IDs, a reviewed migration/backup strategy and a correctly selected build/deploy target. The all-zero local database ID is deliberately a placeholder. No secrets are required to use this foundation locally. Follow [deployment.md](deployment.md) before any authorized remote action. No production readiness or published-environment claim is made.
