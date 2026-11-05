# Project instructions for Codex

## Mission
Build a rules-enforced, multi-user tabletop RPG platform. First supported ruleset is D&D 2024 / SRD 5.2.1. See `BUILD_PLAN.md` for scope, rules-engine contracts, milestones and acceptance criteria. Never claim an unimplemented part of the SRD or game engine is operational.

## Mandatory engineering rules
- TypeScript strict, React/Vite, Hono Cloudflare Worker, Drizzle/D1, Zod, Vitest and Playwright where appropriate. Follow existing project conventions.
- Core rules must be pure, deterministic and testable, independent of UI, storage, network and AI.
- AI only proposes draft structured assets; never executes user-supplied code, overrides validators or mutates character state directly.
- Character eligibility must be checked on the server, not only hidden/disabled in the UI. Distinguish character level, class level, spell known/recorded/prepared/granted and casting slots.
- Never invent or silently import proprietary D&D content outside SRD 5.2.1. Use official SRD provenance, attribution and source locators.
- Content definitions have stable asset IDs, immutable published version IDs and explicit ruleset/version pins.
- No secrets in git; enforce ownership and authorization for every nonpublic resource; use validated inputs and scoped queries.
- Build accessible, responsive interfaces. NEVER clip, crop, truncate or hide substantive text; avoid fixed heights that cut off instructions or validation messages.
- Do not create billable infrastructure, perform production deployment, publish public content or run destructive migrations without explicit user authorization.

## Workflow
1. Inspect repository and current phase in `BUILD_PLAN.md` before changing files.
2. Deliver the smallest complete, verifiable phase. Avoid broad speculative refactors or claiming future phases are finished.
3. Add negative tests for forbidden actions/choices as well as valid scenarios.
4. Run lint, typecheck, tests and build; report what actually ran and any failures.
5. Keep docs updated. Separate `imported`, `reviewed`, `mechanically_mapped`, and `tested` SRD coverage.
6. At handoff, summarize modified files, verification results, exact next milestone and unresolved decisions.
