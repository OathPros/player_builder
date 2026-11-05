# Foundation data model

`packages/db/src/schema.ts` is the Drizzle source; generated SQLite lives in `packages/db/migrations`. Wrangler's migration ledger controls application order. Foreign keys link versions → assets → rulesets.

- `rulesets`: stable ID, game-system ID, display name, corpus version, explicit `planned` status.
- `assets`: stable ID, ruleset pin, name, `spell` type, `synthetic` origin, visibility (`private` by default), publication state (`draft` by default), timestamp. Anonymous reads require public + demo.
- `asset_versions`: stable version ID, asset FK, positive version number, schema version, typed JSON definition, readable text, license, source locator, timestamp. Unique asset/version index prevents duplicate version numbers. JSON validity is checked by SQLite and output contract validation.

Minimal foundation fields only. The full canonical asset model, content hashes/source documents, ownership, characters, campaigns, and audit tables are deferred. Published-version immutability must be enforced at the future write boundary; no HTTP write or publishing workflow exists today. The seed never overwrites existing IDs/versions.

Pagination indexes cover public scope and ruleset/type/ID. Substring search is bounded and parameterized but uses a scan, appropriate only for this one-record demonstration. Revisit FTS and query plans for M3.

Migration policy: generate and review forward migrations, commit metadata, test against a fresh local database and representative data. Never run destructive migrations or remote changes without authorization. A real deployment requires a separate backup/restore plan and explicit remote migration approval. Do not infer transaction serialization from sequential client calls.
