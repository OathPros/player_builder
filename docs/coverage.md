# Coverage — foundation only

No real SRD content or rules automation has been started. The intended corpus is English SRD 5.2.1 from <https://www.dndbeyond.com/srd>. No sections or entity counts have been audited, so completeness percentages cannot be stated.

| Area                                       | Imported    | Reviewed    | Mechanically mapped | Tested      |
| ------------------------------------------ | ----------- | ----------- | ------------------- | ----------- |
| All real SRD 5.2.1 reference content       | Not started | Not started | Not started         | Not started |
| Character creation and levels 1–20         | Not started | Not started | Not started         | Not started |
| Spells, equipment, classes, origins, feats | Not started | Not started | Not started         | Not started |
| Dice, conditions, actions, resources       | Not started | Not started | Not started         | Not started |

The original synthetic fixture has no source passage or executable mechanics. It only demonstrates D1 persistence, API transport, and readable rendering; those tests do **not** count toward SRD or rules coverage. No rules uncertainties have been resolved by guessing.

## Implemented vs planned

| Capability                                   | Status                                               | Evidence                                 |
| -------------------------------------------- | ---------------------------------------------------- | ---------------------------------------- |
| Workspace, strict TS, lint/format, lockfile  | Implemented                                          | Root config                              |
| Home / Library / Characters accessible shell | Implemented; Characters is visibly a placeholder     | `apps/web/src/main.tsx`                  |
| Hono health and safe read-only catalog       | Implemented                                          | `apps/web/worker/index.ts`               |
| Local D1, Drizzle migration, synthetic seed  | Implemented                                          | `packages/db`, `tests/fixtures/seed.sql` |
| Contract / real Worker+D1 / browser tests    | Implemented                                          | `packages/contracts`, `tests`            |
| GitHub Actions verification                  | Configured; remote execution unverified until pushed | `.github/workflows/ci.yml`               |
| Accounts, ownership, sessions                | Not started (M2)                                     | No authentication endpoints              |
| SRD ingestion and provenance audit           | Not started (M3)                                     | No downloaded sources                    |
| Rules and character system                   | Not started (M4–M7)                                  | Reserved package boundaries only         |
| Homebrew, AI, community                      | Not started (M8–M10)                                 | No creation or publication endpoints     |
| Cloudflare resources / deployment            | Not performed                                        | `docs/deployment.md`                     |
