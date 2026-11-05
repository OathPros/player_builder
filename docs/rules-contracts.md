# Contract boundaries

Implemented: branded `RulesetId` / `AssetId`, exact `HealthResponse`, bounded strict query schemas, public demo asset responses, planned ruleset responses, and stable JSON errors in `packages/contracts/src/index.ts`.

Only the synthetic, descriptive `DemoDefinition` is supported. It requires `synthetic: true`, `executable: false`, and schemaVersion `1`. It is not a playable spell schema or a finalized homebrew definition.

Not started: rules expression AST, predicates, dice, character creation/eligibility, class progression, deterministic action resolution, or versioned JSON Schema export for the future full rules language. No callable user code, dynamic user-code loading, `eval`, or AI execution is supported. Follow BUILD_PLAN sections 5–6 in M4 after source/contracts review.
