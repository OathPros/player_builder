# First Codex task — scaffold the project

Read `AGENTS.md` and `BUILD_PLAN.md` in this repository before working. Implement **only the Immediate first Codex sprint in section 13** of `BUILD_PLAN.md` (foundation; M0 + the smallest runnable pieces of M1).

## Goal
Create a clean, runnable React/TypeScript/Vite app on Cloudflare Workers with Hono `/api/v1` routes, a locally migratable D1 database via Drizzle, typed contracts, tests, repository docs and CI. This is not yet an SRD importer, real character builder or AI creator.

## Constraints
- If the repo is empty, initialize the planned pnpm workspace. If it contains files, inspect and adapt rather than deleting existing code.
- Use authoritative current package docs, lock dependencies, and ensure Cloudflare Workers compatibility.
- Add a clearly labeled synthetic demonstration asset, not purported SRD data.
- No paid resources, production deployment, remote database writes, account integrations or external secrets without explicit permission.
- Do not implement user authentication, full rules engine, AI, community publishing or actual SRD import in this first sprint.
- Preserve fully readable text in all layouts; use keyboard-accessible navigation.

## Done when
- A developer can run documented local commands to install, migrate/seed D1, and start the app.
- Home/Library/Characters shell renders with honest empty states.
- `/api/v1/health` returns the specified health schema; `/api/v1/rulesets` and `/api/v1/assets` read the sample database safely.
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` pass; any remaining issues are reported plainly.
- GitHub Actions CI exists and no credentials are committed.
- Documentation states exactly what is implemented and what remains.

## Work pattern
Start with a brief read-only inspection and implementation plan, then make changes. At the end, show commands run and results, the tree of significant added files, and a concise next-phase recommendation. Do not ask questions when a safe default is clear; log design decisions in `docs/architecture.md`.
