# Foundation security

This is an unauthenticated **read-only demonstration**. The only supported anonymous data is explicitly public demo content; repository queries impose that scope independently of query parameters. Private/campaign/draft isolation and mutation rejection have negative integration tests. UI text is rendered as React text; no HTML injection or user-code execution path exists.

Inputs are strict Zod schemas, page sizes bounded, query parameters bound by Drizzle, and literal substring search via SQLite instr. Duplicate and unknown parameters fail closed. API error bodies are stable and do not expose SQL or stack traces. API responses use no-store and nosniff. No external secret is needed.

`.env*` and `.dev.vars*` are ignored except checked-in examples. Never put secrets in browser `VITE_*` values, fixture data, logs, or GitHub source. Future secrets should use Cloudflare secret bindings or ignored local `.dev.vars`. No keys, user records, tokens, OAuth connections, or email-provider integration were created.

Before M2/public use: add Better Auth, sessions/CSRF protection, per-resource ownership, roles, rate limits, abuse protection, password recovery/verification and threat review. Before production: dependency/security audit, CSP strategy compatible with built assets, backups/restore, monitoring, privacy/terms/takedown policy, and load/operational testing. This foundation does not satisfy the M11 hardening gate.

## Dependency audit at handoff

The initial router/build/test advisories were resolved by upgrading React Router, Vite, Vitest, and lint tools before final verification. The full `pnpm audit` still reports two **moderate, development-only** transitive advisories: `esbuild@0.18.20` through Drizzle Kit's legacy loader ([GHSA-67mh-4wv8-2f99](https://github.com/advisories/GHSA-67mh-4wv8-2f99)), and `minimatch@10.2.6` through ESLint/typescript-eslint ([GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249)). No critical/high findings remain.

The esbuild advisory concerns its development server; this project uses Drizzle Kit for local schema generation/checking and does not start that esbuild server. The minimatch advisory concerns pathological glob input; the lint patterns here are repository-controlled. No forced cross-major transitive overrides or advisory suppressions were added. Recheck upstream fixes before production hardening; this is a documented residual tooling limitation, not a zero-vulnerability claim.
