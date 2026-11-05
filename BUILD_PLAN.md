# D&D Rules Platform — Codex Build Plan

**Status:** Implementation specification, v0.1  
**Initial ruleset:** D&D 2024-revised rules, **SRD 5.2.1**  
**Primary stack:** GitHub + Cloudflare Workers + D1 + R2; React/TypeScript/Vite; Hono; Drizzle; Better Auth  
**Product objective:** A rules-enforced character-building and interactive-sheet platform, with a natural-language homebrew authoring pipeline and shareable community asset library.

## 0. What we're building

A person creates an account, chooses a D&D ruleset, creates a level-one character, and makes the choices actually required by the rules. The system offers only choices for which the character qualifies, tracks mandatory choices, computes derived statistics, and won't finalize an illegal character. Players level up, gaining new features and eligible options. They use an interactive sheet to make rolls, track HP, resources, spells, and inventory. People can create spells, items, species, backgrounds, feats, subclasses, classes, and conditions in natural language; the system compiles descriptions to the same validated, versioned content format used by the SRD. Creators can keep assets private, share them with campaigns, or publish them to a moderated public library.

**Non-negotiable invariant:** Rules are validated and executed in deterministic, tested TypeScript. AI may **author proposals** but never determines legality, modifies character state directly, or runs arbitrary user-generated code.

**Product truth:** The SRD is a published rules corpus, not a ready-made complete character-builder implementation. The team must both (A) import all licensed reference content and (B) model/verify mechanical behavior. Track these as separate coverage goals; do not claim a fully functioning 1–20 builder based on content-import alone.

**Release target:** D&D SRD 5.2.1 support before adding other rulesets. Design clean boundaries for other systems, but do not prematurely generalize the D&D implementation into a complex meta-language.

## 1. Product scope and progression

### Launch (v1) must support

1. Registration, login, account recovery and secure sessions.
2. Readable, searchable, filterable access to **all content included in the authoritative English SRD 5.2.1**, with provenance and required attribution. Full-coverage manifests and audit reports.
3. A rules-driven, guided character creator that handles all **SRD character creation options** and levels 1–20: class, subclass, species, background, abilities, skills, proficiencies, equipment, feats, spell selections, prerequisites, progression, multiclassing when permitted, and mandatory decisions.
4. Complete character persistence, draft/final validation, level-up workflows, ability modifiers, derived statistics, and a readable responsive sheet.
5. Inventory/equipment and actions, including spellcasting and tracking spell slots or other resources; deterministic dice, saving throws, conditions, effect duration, damage/resistance and basic actions within supported automation coverage.
6. Homebrew content authored through structured form editing, compatible with the same content schema; private by default.
7. An AI-assisted text-to-asset flow: text -> typed proposal -> validation -> questions for unresolved fields -> preview -> test -> save -> optionally publish.
8. User library, campaign-scoped content allowances, public community library with attribution, publication, moderation, versioning, reporting and consent to publication terms.
9. Export/import for user-owned characters and assets (machine-readable JSON, versioned schemas) and a practical PDF/print sheet if desired.
10. Documented audit tests covering the D&D rules supported and an explicit registry of mechanics that cannot yet be automated.

### Deliberately deferred

- Virtual tabletop with maps, tokens, fog of war and positional automation; collaborative real-time combat; encounter simulation at scale.
- Buying/selling content, subscriptions, marketplace payments or royalties.
- Importing proprietary rulebooks or scraping gated content.
- Running arbitrary scripts uploaded by users; unbounded formula evaluation.
- Other RPG rulesets, until the D&D vertical slice and content contracts are stable.

### Definition of "works"

A player **cannot** select a third-level Wizard spell merely because the character is overall level 3. The engine uses Wizard class progression and current spell acquisition/preparation rules. More generally, class levels, total level, granted spells from other sources, multiclass spell slots, spell lists, level-based feature unlocks, and exceptional features must be represented separately. A character cannot be finalized with unresolved mandatory choices or illegal selections. The UI cannot be the only enforcement point: every server mutation revalidates.

## 2. Architecture and stack

| Layer | Choice | Purpose |
|---|---|---|
| Source and CI | GitHub + GitHub Actions | Versioned PRs; lint/typecheck/unit/integration/E2E gates |
| Web | React, TypeScript, Vite, React Router | Accessible wizard-style builder, character sheets, library |
| API | Cloudflare Workers + Hono | Typed API endpoints, validation, auth checks, rules invocation |
| Core | Pure TypeScript packages | System-neutral contracts and D&D-specific deterministic rules |
| Database | Cloudflare D1 SQLite + Drizzle | Users, versions, assets, characters, campaigns, audit trails |
| Files | Cloudflare R2 | Character portraits, user-approved artwork and uploads |
| Identity | Better Auth native Cloudflare D1 support | Sessions, email/password and optional OAuth |
| Schemas | Zod + versioned JSON schema exports | Input validation, asset validation, API contracts |
| Testing | Vitest, Playwright, worker integration tests | Deterministic tests and browser flows |
| AI | Server-side provider adapter | Structured asset proposal generation, never authoritative execution |
| Deployment | Cloudflare Workers Builds GitHub integration | Previews and production deployment from selected branches |

Start with **one deployed Worker** serving the SPA and `/api/v1/*` route namespace, and one D1 database per environment (`dev`, `staging`, `prod`). Cloudflare's Vite plugin provides a Workers-like dev environment. Keep file storage optional until uploaded images are implemented.

Use SQL indexes and pagination for library searches. D1 is adequate for initial usage, but isolate repository/data access behind interfaces to allow future database migration. Do not use D1 to store large uploaded file binaries.

**D1 constraint:** No conventional interactive cross-request SQL transactions. Use D1 batch operations and atomic conditional mutation patterns where needed; pair mutations with idempotency keys and optimistic concurrency checks (`revision` on mutable character state). Never assume sequential client requests are serialized.

## 3. Repository layout

```text
rpg-forge/
├── AGENTS.md                        # short, durable Codex rules
├── BUILD_PLAN.md                    # this specification
├── START_CODEX.md                   # first task, bounded to foundation
├── README.md
├── pnpm-workspace.yaml
├── package.json
├── .github/workflows/ci.yml
├── apps/
│   └── web/
│       ├── src/                     # React SPA, routes, components, design system
│       ├── worker/                  # Hono API entrypoint
│       ├── wrangler.jsonc           # Workers bindings/env, no secrets
│       └── vite.config.ts
├── packages/
│   ├── contracts/                   # shared Zod schemas / API types
│   ├── rules-core/                  # pure predicates, choices, dice, effects
│   ├── rules-dnd-2024/              # SRD 5.2.1 rules adapter and data definitions
│   ├── db/                          # Drizzle schema, migrations, repositories
│   └── srd-ingest/                  # licensed source import + audit tooling
├── content/
│   ├── sources/                     # download instructions/manifests, NOT pirated content
│   └── srd-5.2.1/                   # reviewed normalized content + coverage manifests
├── docs/
│   ├── architecture.md
│   ├── data-model.md
│   ├── rules-contracts.md
│   ├── source-provenance.md
│   ├── security.md
│   ├── legal-attribution.md
│   └── coverage.md
└── tests/
    ├── fixtures/
    ├── integration/
    └── e2e/
```

Use pnpm workspaces, strict TypeScript, ESLint and Prettier. Keep `rules-core` free of HTTP, UI, storage and AI dependencies. Avoid circular package dependencies.

## 4. Canonical data model

### Primary identifiers

- `system_id`: `dnd-5e` (higher-level game family).
- `ruleset_id`: `dnd5e-2024-srd` (mechanical variant).
- `ruleset_version`: `5.2.1` (immutable published corpus revision).
- `asset_id`: permanent UUID or prefixed stable ID; never use display name as identity.
- `asset_version_id`: immutable version of a spell, class, feature, item, etc.
- `source_ref`: source document, section/page locator, license, revision, provenance.
- `character_id`, `campaign_id`, `user_id`: separate identities with enforced ownership.

### Proposed tables (create in stages)

**Identity:** Auth library-managed `user`, `session`, `account`, `verification`; application `user_profile`, `user_settings`, `user_role`.

**Rules and content:** `game_systems`, `rulesets`, `source_documents`, `assets`, `asset_versions`, `asset_relations`, `asset_tags`, `content_import_runs`, `content_coverage`, `asset_collections`, `collection_members`, `asset_reports`, `asset_moderation_actions`.

**Characters:** `characters`, `character_class_levels`, `character_choices`, `character_feature_grants`, `character_spells`, `character_equipment_instances`, `character_state`, `character_events`, `character_snapshots` (optional cache), `character_operation_keys`.

**Campaigns:** `campaigns`, `campaign_members`, `campaign_characters`, `campaign_asset_permissions`, `campaign_ruleset_pins`.

**AI:** `generation_jobs` (input, schema version, model/provider, privacy, tokens/cost when available, proposal status, validation issues; avoid storing personal secrets).

### Core asset record

`assets` holds identity and ownership: `id`, `system_id`, `ruleset_id`, `type`, `slug`, `creator_user_id` nullable for official source, `origin` (`srd`, `homebrew`), `visibility` (`private`, `campaign`, `public`), `publication_status`, `created_at`, `updated_at`.

`asset_versions` holds immutable data: `id`, `asset_id`, `version_number`, `schema_version`, `definition_json`, `display_text`, `source_document_id` nullable, `source_locator`, `license`, `change_notes`, `content_hash`, `created_at`.

Published versions are immutable. Creating a revision never changes the content a character or campaign previously pinned. Add explicit review/migration prompts and compatibility checks for upgrades.

### Characters

- `characters`: owner, ruleset pin, name, draft/valid status, revision, creation timestamps.
- `character_class_levels`: each class and its class level; sum defines character level.
- `character_choices`: each selected option plus **why** it was eligible, source/grant, selection pool, version pin and level selected.
- `character_feature_grants`: derived grants tied to source and version; do not treat these as independent player choices.
- `character_state`: mutable HP, expended spell slots/resources, conditions, death saves, exhaustion and similar state.
- `character_events`: append-only changes (level up, rest, HP changed, spell cast, item equipped), actor, timestamp, previous/new revision, idempotency key. Avoid recording sensitive tokens or untrusted HTML.

Store chosen **inputs** as authoritative; derive stats from rules + inputs. Cache the computed sheet only with a revision/cache invalidation strategy.

### Relationships

Use typed edges: `class_has_feature`, `subclass_of`, `spell_on_class_list`, `background_grants_feat`, `item_grants_action`, `feature_grants_resource`, `feature_changes_stat`, `feature_references_spell`, `requires`, `supersedes`. Enforce rule-appropriate edge kinds and detect invalid reference cycles.

## 5. Versioned content definition language

Avoid a giant untyped JSON blob. Prefer discriminated unions for asset kinds: `spell`, `class`, `subclass`, `species`, `background`, `feat`, `item`, `feature`, `condition`, `monster`, `rule`, `equipment`, `skill`, `language`, etc. Preserve both human-readable text and executable fields.

### Example homebrew spell (specified vs unresolved)

```json
{
  "schemaVersion": "1",
  "kind": "spell",
  "name": "Arcane Burst",
  "rulesetId": "dnd5e-2024-srd",
  "activation": { "type": "action", "cost": 1 },
  "range": { "type": "distance", "feet": 120 },
  "area": { "shape": "sphere", "radiusFeet": 5 },
  "targets": { "selector": "creatures_in_area", "includeAllies": true },
  "effects": [{
    "type": "damage",
    "dice": "3d6",
    "damageType": null,
    "save": {
      "ability": "dexterity",
      "dc": { "ref": "caster.spell_save_dc" },
      "onSuccess": { "damageMultiplier": 0.5, "round": "down" },
      "onFailure": { "damageMultiplier": 1 }
    }
  }],
  "unresolved": [
    "spellLevel",
    "school",
    "damageType",
    "components",
    "duration",
    "concentration",
    "classSpellLists",
    "scalingRules"
  ]
}
```

This is a **draft**, not a publishable executable spell. The compiler identifies omitted but required mechanical attributes and asks the author, never silently invents them. The example's `caster.spell_save_dc` is a supported expression reference, not JavaScript.

### Rule expression AST

Create closed, typed operations:

- **Predicates:** `all`, `any`, `not`, `compare`, `has_class_level`, `has_character_level`, `has_proficiency`, `has_feature`, `ability_at_least`, `spell_on_list`, `choice_count`, `source_grant`.
- **Values:** numeric literals, permitted character stat references, named resources, supported arithmetic over validated operands.
- **Effects:** `grant_proficiency`, `grant_feature`, `modify_stat`, `grant_spell`, `grant_action`, `spend_resource`, `recover_resource`, `apply_condition`, `remove_condition`, `roll_damage`, `heal`, `set_duration`, `consume_slot`, `require_target`, `make_save`.
- **Triggers:** `on_character_create`, `on_level_gain`, `on_equip`, `on_unequip`, `on_attack_hit`, `on_turn_start`, `on_turn_end`, `on_rest`, `on_cast`, `on_save_success/failure` where supported.
- **Selection pools:** eligible source collections + minimum/maximum count + sorting, prerequisites + validation messages + provenance.

**Do not use `eval`, `new Function`, dynamic imports of user code, or store callable JS in asset definitions.** Validate maximum nesting depth, formula complexity, dice count, target count and loop-free execution. Every operation gets unit tests and a clear failure response when unsupported.

### Dice

Build a parser and deterministic testable roller: `d20`, `2d6+3`, ability/proficiency modifiers, advantage/disadvantage, natural 1/20 where relevant. Test using injectable RNG; store roll inputs and outcomes separately, with no reliance on AI.

## 6. Rules engine API and behavior

Suggested pure interfaces (illustrative, adjust after design review):

```ts
interface RulesetAdapter {
  id: string;
  version: string;
  getCreationSteps(context: CharacterContext): ChoiceStep[];
  getAvailableChoices(context: CharacterContext, stepId: string): EligibleChoice[];
  validateSelection(context: CharacterContext, choice: ChoiceInput): ValidationIssue[];
  validateCharacter(context: CharacterContext): ValidationIssue[];
  getLevelUpPlan(context: CharacterContext, targetClassId: string): LevelUpPlan;
  deriveSheet(context: CharacterContext): DerivedCharacterSheet;
  resolveAction(context: ActionContext, intent: ActionIntent): ActionResolution;
}
```

**Rule construction:**

1. Compute selection options with the ruleset adapter and content catalog, not a client-only filter.
2. Capture explicit choices with `selectionPoolId`, source grant, class level/character level, asset-version ID.
3. Recompute derived stats after every committed selection/change; flag displaced or invalid choices.
4. Maintain `issues: {code, severity, stepId, message, alternatives?}`. Block finalize/level-up commit on `error`, not on informational `warning`.
5. Support drafts with unresolved selections; don't silently assign defaults for mandatory decisions.
6. Distinguish character level from individual class levels, and spells **known**, **in spellbook**, **prepared**, **granted**, **available to cast** and **currently castable**.
7. Resolve exceptions by explicit, scoped source grants; exceptions may override ordinary restrictions only when their effect definition says so.
8. Maintain ruleset and asset pins so future content changes can't retroactively alter characters without review.
9. Explain every lock in the UI: "Requires Wizard level 5" or "Prerequisite: Strength 13", not just disabled controls.

### Character creation stages

`Choose ruleset -> class -> species -> background -> ability-score method and allocations -> proficiencies/skills/languages and other granted choices -> starting equipment/wealth -> spells and prepared choices where relevant -> review -> finalize`.

Step order must support dependencies and the actual SRD 5.2.1 rules. For every option, display eligibility, required count, source and next unresolved selection. Support standard array, point buy, and manual/rolled with declared validity/house-rule mode as appropriate.

### Level-up

Prepare a non-destructive preview from current level N -> N+1. Select class gained, apply class-level progression, evaluate features, subclass, abilities/feats, HP method, spell/slot progression, all mandatory choices and multiclass prerequisites. Require confirmation before atomic commit and write an audit event. Offer migration/rollback safeguards.

### Core D&D automation topics

Ability modifiers, proficiency bonus, ability checks, saving throws, skills, passive scores, hit dice, AC and equipment, weapon properties/mastery, spell lists and casting, components, durations, concentration, damage types, resistances, vulnerabilities and immunities, conditions, reactions/bonus actions, action economy, resource recharge, class progression, multiclassing, rests, death saves, and exhaustion. Not all need automation in the first playable slice, but each has explicit coverage and tests before v1's claim of full rule support.

## 7. SRD 5.2.1 ingestion and verification

**Authoritative source:** https://www.dndbeyond.com/srd (English SRD v5.2.1 downloadable there). License: CC BY 4.0 with required attribution and source/changes notices. Do not import from D&D Beyond character-builder APIs or other proprietary databases.

Build a reproducible pipeline:

1. `sources.json` manifest: official URL, language, published version/date, download checksum, license and attribution text.
2. Source acquisition: document downloaded from the official SRD page, with checksum. Avoid assuming a stable machine-readable canonical JSON exists.
3. Deterministic extraction into **raw source sections** with locators and provenance. If PDF extraction is imperfect, mark sections `needs_review` and use reviewed data files; never auto-publish guesses.
4. Normalize into schemas: spells, class tables/features, subclasses, species, backgrounds, feats, items, equipment, monsters, conditions, general rules, glossary, etc.
5. Link references and identifiers across content categories; confirm deterministic upsert, no duplicate generated assets after rerunning import.
6. Validate content schemas, all required fields and all references; produce a machine-readable completeness report by source section, entity type and readiness state.
7. Human review mechanically consequential fields (e.g., level thresholds, uses, spell lists, feature options, numerical formulas and table progression). Track `imported`, `reviewed`, `mechanically_mapped`, `tested` as separate flags.
8. Expose a public attribution page with source, license, version, modifications and required acknowledgments. Clearly distinguish official SRD data from community homebrew.

**Coverage gate:** A v1 claim of **complete SRD content** needs 100% of content inventory sections present and searchable in the app, plus zero unresolved import blockers. A v1 claim of **complete rules-enforced character creation** needs all player-facing SRD character creation and level-up mechanics modeled and covered by tests. Any rule not automated must be surfaced as text/manual resolution, not pretended to be automated.

**Source exclusions:** The SRD omits specific WotC content (including some classes/species/monsters). Do not add absent material as "official SRD". Allow original community content through the moderated homebrew pipeline.

## 8. API contract, authentication and authorization

Namespace all routes `/api/v1` with server-side Zod validation, consistent errors and pagination. Sample endpoints:

```text
GET    /api/v1/health
GET    /api/v1/rulesets
GET    /api/v1/assets?rulesetId=&type=&q=&page=&visibility=
GET    /api/v1/assets/:assetId/versions/:versionId
GET    /api/v1/srd/coverage
POST   /api/v1/characters
GET    /api/v1/characters
GET    /api/v1/characters/:id
GET    /api/v1/characters/:id/creation-steps
GET    /api/v1/characters/:id/choices?stepId=
POST   /api/v1/characters/:id/choices
POST   /api/v1/characters/:id/validate
POST   /api/v1/characters/:id/finalize
POST   /api/v1/characters/:id/level-up/preview
POST   /api/v1/characters/:id/level-up/commit
POST   /api/v1/characters/:id/actions/preview
POST   /api/v1/characters/:id/actions/commit
POST   /api/v1/homebrew/drafts
PATCH  /api/v1/homebrew/drafts/:id
POST   /api/v1/homebrew/drafts/:id/validate
POST   /api/v1/homebrew/drafts/:id/publish
POST   /api/v1/homebrew/generate
GET    /api/v1/campaigns/:id/allowed-assets
```

**Security model:**

- Better Auth with D1; server-side HTTP-only Secure cookies, appropriate SameSite/CSRF safeguards, session validation; optional OAuth. Confirm deployed runtime compatibility and current auth package docs.
- Ownership/authorization checked on **every read and mutation**, including nested character IDs; character permissions differ for owner, DM, shared viewer and admin.
- Roles: `user`, `moderator`, `admin`, plus separate campaign role `dm`/`player`.
- Assets: private only owner; campaign assets only authorized members; public published assets readable by all. Official SRD is read-only to ordinary users.
- Public homebrew: manual review/approval or a defined moderated process, author attribution, report/remove workflow, content terms/licensing, IP takedown process.
- Sign-up protection, email verification, rate limits, abuse quotas, secure password reset, CAPTCHA/Turnstile at abuse boundaries if needed.
- For API-generated assets, enforce per-user limits, model cost budgets, timeouts, prompt size limits, content sanitization and audit logging; no exposed provider keys.
- Privacy: export/delete account, cascade rules, retained campaign audit considerations, no leaking private homebrew through search or preview, protect minors if exposed publicly.
- Secrets via Cloudflare secrets or local ignored `.dev.vars`, never commit tokens.

## 9. AI compiler (after non-AI foundations work)

**Process:**

`Natural language -> LLM structured draft -> Zod schema check -> rules semantic validation -> unresolved field questions -> preview/test -> creator acceptance -> immutable version -> use/publish`.

Example request: "A spell cast as an action with 120-foot range, 3d6 damage to all creatures in a five-foot-radius area, Dex save for half."

Expected: A spell draft with activation, range, area, target selector, dice expression, Dexterity saving throw and half-on-success. It must ask for missing spell level, damage type, required components, casting lists, duration etc. It must **not** automatically publish or claim balanced rules. A level 1 character may only select it once the completed spell definition and all grants/prerequisites allow it.

- Implement provider adapter (do not lock core system to one AI provider).
- Require structured output and schema validation.
- Reject unsupported mechanics with actionable suggestions, e.g., "This trigger is not executable yet; keep as descriptive/manual effect."
- Capture audit trail of what AI proposed and what creator accepted.
- Support revision without overwriting existing published versions.
- Show a clear distinction between mechanically valid and play-tested/balanced.

## 10. Frontend product experience

Primary routes:

```text
/                         Welcome, discover, sign in
/library                  SRD + community filters
/library/:assetId          Readable definition + source + versions
/characters               My characters
/characters/new           Guided creation wizard
/characters/:id           Interactive sheet
/characters/:id/level-up  Guided progression
/create                   Choose homebrew type
/create/:type              Form or natural-language creator
/my-library               Drafts, published content, collections
/campaigns                Campaign list
/campaigns/:id            DM, members, allowed resources
/account                  Profile, privacy, exports
/attribution              License and source acknowledgments
```

**UX principles:**

- Functional, accessible, keyboard-usable UI with WCAG 2.2 AA contrast and semantics.
- Responsive, mobile-first sheet and builder; no clipped text, truncated instructions, hidden error messages or fixed-height containers that cut off text; text wraps naturally at 320px and up.
- Progress indicators show completion (e.g., "Choose 2 of 3 proficiencies") and unresolved choices.
- Locked choices show **exact eligibility reason** and unlock threshold; users can't bypass by manipulating client state.
- Distinguish SRD/verified mechanics, homebrew, private, campaign approved, public, draft.
- Always support character draft save/resume and clear errors, navigation and backtracking.
- For AI creation, present a side-by-side plain English + structured mechanics preview with validation failures.
- On the character sheet, show the source of each modifier and grant (e.g., "AC +1 from equipped item") for transparency.

## 11. Rules test matrix and release gates

**Framework:** Vitest for domain logic and APIs, deterministic RNG fixtures, Playwright for E2E in real browser; CI on every PR.

Minimum fixtures and tests:

1. **Wizard 1**: Valid creation choices, learned/recorded/prepared spells correctly modeled; third-level spell prohibited; missing required selections block finalization.
2. **Wizard 5**: Third-level spell eligibility where appropriate, subject to spellbook/preparation rules.
3. **Character level vs class level:** Wizard 3 / Cleric 2 doesn't treat fifth character level as Wizard 5 for spell selection; separate multiclass slots and eligibility.
4. **Subclass:** Class-specific level threshold and mandatory subclass choice; unauthorized subclass cannot be selected.
5. **Species/background:** Proficiencies, ability scores, feat and other mandatory selection restrictions.
6. **Feat prerequisite:** Ineligible feats locked in UI and rejected on server.
7. **Equipment:** AC, weapon properties, equip restrictions and modifier stacking recalculated after equip/unequip.
8. **Spell:** 3d6 area damage; one damage roll where specified, independent saves per creature, half damage rounded down, valid DC, resource consumption, range and targeting validation.
9. **Homebrew:** Draft cannot be published with missing fields; published version immutable; private asset unavailable to unrelated user; campaign authorization works.
10. **Concurrency:** Two simultaneous resource spend/level-up attempts don't spend resources twice or corrupt choices.
11. **Authorization:** User A can't read or mutate user B's private character/assets via guessed IDs; roles enforced server-side.
12. **SRD coverage:** Every manifest section imported, no unresolved references, consistent version identifiers, attribution included.
13. **Accessibility:** All required controls keyboard-usable, error announcements, responsive text without truncation at mobile/tablet/desktop.
14. **Data migrations:** Fresh local DB can migrate, seed, and run tests consistently; production migration plan and backups documented.

Automate coverage from class levels 1–20 and all published SRD class progression tables with data-driven fixtures. Keep a manual rules review checklist for mechanics not reducible to simple tests.

Every milestone must satisfy: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, relevant integration/e2e commands, migration check. Never claim verification passed unless the command actually ran and succeeded.

## 12. Milestones for Codex

Execute phases sequentially. Each phase gets an issue/branch/PR, tests, screenshots where UI exists, and a concise completion report. Do not ask Codex to implement the whole product in one prompt.

### M0 — Repository and decision records

**Deliver:** monorepo scaffold; README, AGENTS.md, BUILD_PLAN.md; architecture and ADRs; initial work breakdown; GitHub CI. Confirm initial scope/exception handling decisions.

**Acceptance:** clean clone `pnpm install`, typecheck, lint, test and build; no secrets; CI runs; source tree matches plan; `GET /api/v1/health` documented.

### M1 — Cloudflare-connected application skeleton

**Deliver:** React/Vite SPA, Hono `/api/v1/health`, Wrangler config and local D1 binding, Drizzle migration workflow, minimal navigation and design system, dev/staging/prod env docs. Make app deployable to Workers via GitHub, without requiring production credentials for local tests.

**Acceptance:** local web app works, API returns health JSON, migration runs on clean local D1, one simple DB write/read integration test, CI passes, deployment steps documented.

### M2 — Accounts and permissions

**Deliver:** Better Auth email/password with verification/recovery or clear email-provider setup, account pages, authenticated API, ownership checks, baseline RBAC, test users and seed fixtures.

**Acceptance:** test user can register/login/logout, can access own `/me`, unauthenticated returns 401, accessing another user's private resource returns 403/404 as appropriate, reset/verification path tested or explicitly not yet enabled for public access.

### M3 — SRD source ingestion and browse-only library

**Deliver:** authoritative source manifest, reproducible parsing/import process, stable content IDs, all SRD 5.2.1 reference content searchable with provenance and attribution; entity/section coverage dashboard. Mechanical mapping status clearly distinguished from imported text.

**Acceptance:** all source sections accounted for by report, no duplicate imports, semantic categories and linked source references, no invented/excluded SRD content, list/detail/filter/search work. Any manual review tasks explicit.

### M4 — Rules engine primitives

**Deliver:** typed predicate/expression engine, selection pools, grants/modifiers, dice, validation-issue model, stable rules contracts, D&D adapter skeleton, unit fixtures and stat calculations.

**Acceptance:** 100% tests for supported operations, unsupported effects fail closed, injection-safe validation, no AI/DB/UI dependency in pure rules packages.

### M5 — First complete playable vertical slice: Wizard 1 -> 2

**Deliver:** guided Wizard character creation using real SRD data and actual required selections; draft/save; summary; finalize with validation; interactive sheet with ability stats and basic resources; safe Wizard 1->2 level-up. Include locked spells and reasons.

**Acceptance:** end-to-end real user account -> new Wizard -> mandatory choices -> saved valid sheet -> level up. Server rejects Wizard 1 Fireball selection, invalid feats or missing mandatory choices. Save/reload preserves all selections. Playwright test proves flow.

### M6 — All SRD character classes and levels 1–20

**Deliver:** feature/class/subclass progression, all SRD origins, ability methods, feats, spell lists, multiclassing, spell progression, inventory/equipment, comprehensive rules-fixture suite.

**Acceptance:** full SRD creation/level-up rule matrix verified, each class 1–20 data-driven tests, every required choice tracked, multiclass test cases pass; any manual-only features disclosed.

### M7 — Interactive gameplay sheet

**Deliver:** dice/action resolution; spell casting, tracking slots/resources, short/long rests, equipment, conditions, hit dice, HP/death saves, effect timing. Build preview/commit separation so a misclick does not mutate state.

**Acceptance:** deterministic tests for combat decisions, idempotent resource spending, reversible or audited mutations, no cross-user state leakage.

### M8 — Structured homebrew

**Deliver:** player-created assets via forms, per-type field editing, mechanical validator, private draft lifecycle, preview/test, versioning, character integration and campaign-scoped visibility.

**Acceptance:** homemade spell can be selected when qualified, rejected when not; revisions do not change pinned users; malformed definitions rejected.

### M9 — Natural-language AI creation

**Deliver:** provider-agnostic AI interface, text-to-schema proposals, unresolved-property prompts, review UI, cost/rate limits, test/publish handoff.

**Acceptance:** the sample 120-ft 3d6 Dexterity-save spell produces a valid draft of known fields, highlights missing mandatory fields, and yields a functioning spell after creator completion and validation; AI cannot bypass rules or write directly to DB.

### M10 — Community library and campaign controls

**Deliver:** publishing, discoverability, collections, campaign allowlists, DM review, cloning/remixing and attribution, moderation/reporting.

**Acceptance:** published assets available subject to permissions; private data remains private; campaigns can explicitly permit/block homebrew; deletion/versioning rules tested.

### M11 — Production hardening

**Deliver:** audit/security/accessibility review, backup/restore, D1 query performance/indexes, abuse controls, load test, recovery procedures, privacy/terms/takedown pages and cost monitoring.

**Acceptance:** production checklist passed, no P0 authorization flaws, operational runbook, automated deploy and rollback procedure.

## 13. Immediate first Codex sprint (implement now)

### Goal

Create a clean, runnable, Cloudflare-ready repository foundation **without pretending the SRD or character builder is implemented**.

### Exact task list

1. Inspect repository. If empty, initialize a pnpm monorepo with packages and apps described above. If existing, adapt respectfully; do not wipe source.
2. Create `AGENTS.md` and planning docs, ADR for single Worker + D1, and a `README` with first-run commands.
3. Add React/Vite with Cloudflare Vite plugin and a tiny responsive accessible shell (Home / Library / Characters); **placeholders must be visibly labelled**.
4. Add Hono Worker route `GET /api/v1/health` returning `{status:"ok", app:"rpg-forge", version:"0.1.0"}`.
5. Add shared `contracts` package for `RulesetId`, `AssetId`, and a Zod `HealthResponse` schema.
6. Configure Drizzle + D1 local migration with minimal `rulesets`, `assets`, `asset_versions` tables (only foundation fields); create a read-only seed fixture for one **clearly labelled synthetic** demo spell (not falsely attributed to SRD).
7. Add `GET /api/v1/rulesets` and `GET /api/v1/assets` using D1 with cursor/page controls, stable JSON errors and Zod validation; no unauthenticated mutation endpoints.
8. Add Vitest tests for contracts and a Wrangler-supported integration test for DB-backed API routes.
9. Add CI (`pnpm install --frozen-lockfile`, lint, typecheck, test, build) and `.env.example`/`.dev.vars.example`; all secrets ignored.
10. Provide precise instructions for creating Cloudflare resources and connecting GitHub; **do not deploy, create billable infrastructure or request secrets unless specifically authorized**.
11. Run tests, fix any actual failures, and provide a checklist of implemented vs planned features with file references.

### First sprint done when

- `pnpm install`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` pass (or limitations honestly reported).
- Local React app renders and `/api/v1/health` succeeds.
- Local D1 migration and seed command work twice without creating duplicate records.
- API lists exactly the synthetic fixture and configured ruleset (no false 'SRD imported' claim).
- No secrets committed, no external deploy or paid resources created.
- `docs/coverage.md` marks all real SRD ingest and rules automation **not started**.

## 14. Implementation policies for Codex

- Implement only the explicitly assigned milestone, not future placeholders presented as finished features.
- Before changing code, inspect the repository and write a short plan; preserve existing content. After changes, show the actual command results.
- No fabricated source content, unverified counts, TODO implementations that silently pass as real ones or invented function behavior.
- Do not truncate visible text; test layouts at mobile/tablet/desktop.
- Keep APIs typed and validate every client input server-side. Separate rule eligibility from display filtering.
- Never commit API keys, secrets, personal data, or copyrighted non-SRD sourcebook material.
- Use stable, reproducible migrations and fixtures.
- When a rule is uncertain, link to the authoritative SRD passage in `docs/coverage.md` and flag for review instead of guessing.
- For any new user-facing rule, add the negative test (unauthorized/ineligible) as well as the valid test.
- Write small cohesive PR-sized changes. End each milestone with a commit summary, tests run and remaining blockers.

## 15. Sources and technical references

- Official SRD 5.2.1 and FAQ: https://www.dndbeyond.com/srd
- Creative Commons BY 4.0 license: https://creativecommons.org/licenses/by/4.0/
- Cloudflare React/Vite + Workers: https://developers.cloudflare.com/workers/framework-guides/web-apps/react/
- Cloudflare Workers GitHub integration: https://developers.cloudflare.com/workers/ci-cd/builds/git-integration/github-integration/
- Cloudflare D1 guides: https://developers.cloudflare.com/d1/get-started/
- Cloudflare D1 migrations: https://developers.cloudflare.com/d1/reference/migrations/
- Cloudflare D1 platform limits: https://developers.cloudflare.com/d1/platform/limits/
- Hono Workers + Vite: https://hono.dev/docs/getting-started/cloudflare-workers-vite
- Better Auth D1: https://better-auth.com/blog/1-5
- Codex `AGENTS.md`: https://learn.chatgpt.com/docs/agent-configuration/agents-md

## 16. Acceptance demo for eventual v1

A new user registers, creates a Wizard, selects all required level 1 options, and cannot choose a spell above their eligible level. They finalize and see a coherent sheet with correct skills, modifiers, equipment, spellbook/preparation and slots. They level up and gain only the appropriate new options. They use an eligible spell and the app validates cost and records consequences. A creator then describes a 120-foot, 5-foot-radius, 3d6 Dexterity-save-for-half spell. The system asks for missing required fields, compiles it, validates it, and permits it to be used only by appropriately qualified characters, while keeping creator/private/campaign/public permissions intact. A different player's private character and drafts are not readable by manipulating API requests.
