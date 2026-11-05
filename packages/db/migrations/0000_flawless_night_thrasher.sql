CREATE TABLE `asset_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`asset_id` text NOT NULL,
	`version_number` integer NOT NULL,
	`schema_version` text NOT NULL,
	`definition_json` text NOT NULL,
	`display_text` text NOT NULL,
	`license` text NOT NULL,
	`source_locator` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "positive_version" CHECK("asset_versions"."version_number" > 0),
	CONSTRAINT "valid_definition" CHECK(json_valid("asset_versions"."definition_json"))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `asset_version_number` ON `asset_versions` (`asset_id`,`version_number`);--> statement-breakpoint
CREATE TABLE `assets` (
	`id` text PRIMARY KEY NOT NULL,
	`ruleset_id` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`origin` text NOT NULL,
	`visibility` text DEFAULT 'private' NOT NULL,
	`publication_status` text DEFAULT 'draft' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`ruleset_id`) REFERENCES `rulesets`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "asset_type" CHECK("assets"."type" = 'spell'),
	CONSTRAINT "asset_origin" CHECK("assets"."origin" = 'synthetic'),
	CONSTRAINT "asset_visibility" CHECK("assets"."visibility" IN ('private', 'campaign', 'public')),
	CONSTRAINT "asset_status" CHECK("assets"."publication_status" IN ('draft', 'demo'))
);
--> statement-breakpoint
CREATE INDEX `assets_public_page` ON `assets` (`visibility`,`publication_status`,`id`);--> statement-breakpoint
CREATE INDEX `assets_ruleset_page` ON `assets` (`ruleset_id`,`type`,`id`);--> statement-breakpoint
CREATE TABLE `rulesets` (
	`id` text PRIMARY KEY NOT NULL,
	`system_id` text NOT NULL,
	`name` text NOT NULL,
	`version` text NOT NULL,
	`status` text NOT NULL,
	CONSTRAINT "ruleset_status" CHECK("rulesets"."status" = 'planned')
);
