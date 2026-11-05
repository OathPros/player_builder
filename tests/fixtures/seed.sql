-- Original synthetic text, dedicated under CC0-1.0. This is NOT SRD content.
-- Immutable, stable IDs; rerunning never replaces an existing version.
INSERT INTO rulesets (id, system_id, name, version, status)
VALUES ('dnd5e-2024-srd', 'dnd-5e', 'D&D 2024 / SRD (planned)', '5.2.1', 'planned')
ON CONFLICT(id) DO NOTHING;
--> statement-breakpoint
INSERT INTO assets (id, ruleset_id, name, type, origin, visibility, publication_status, created_at)
VALUES ('demo-synthetic-spark', 'dnd5e-2024-srd', 'Synthetic Demo Spark', 'spell', 'synthetic', 'public', 'demo', '2026-11-05T00:00:00Z')
ON CONFLICT(id) DO NOTHING;
--> statement-breakpoint
INSERT INTO asset_versions (id, asset_id, version_number, schema_version, definition_json, display_text, license, source_locator, created_at)
VALUES ('demo-synthetic-spark-v1', 'demo-synthetic-spark', 1, '1', '{"schemaVersion":"1","kind":"spell","synthetic":true,"description":"An imaginary spark for demonstrating catalog storage and rendering. No game mechanics are defined.","executable":false}', 'An imaginary spark for demonstrating catalog storage and rendering. No game mechanics are defined.', 'CC0-1.0', 'Original synthetic fixture; not SRD content', '2026-11-05T00:00:00Z')
ON CONFLICT(id) DO NOTHING;
--> statement-breakpoint
