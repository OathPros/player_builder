import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';
import type { Asset } from '@rpg-forge/contracts';

export const rulesets = sqliteTable(
  'rulesets',
  {
    id: text('id').primaryKey(),
    systemId: text('system_id').notNull(),
    name: text('name').notNull(),
    version: text('version').notNull(),
    status: text('status', { enum: ['planned'] }).notNull(),
  },
  (t) => [check('ruleset_status', sql`${t.status} = 'planned'`)],
);
export const assets = sqliteTable(
  'assets',
  {
    id: text('id').primaryKey(),
    rulesetId: text('ruleset_id')
      .notNull()
      .references(() => rulesets.id),
    name: text('name').notNull(),
    type: text('type', { enum: ['spell'] }).notNull(),
    origin: text('origin', { enum: ['synthetic'] }).notNull(),
    visibility: text('visibility', { enum: ['private', 'campaign', 'public'] })
      .notNull()
      .default('private'),
    publicationStatus: text('publication_status', { enum: ['draft', 'demo'] })
      .notNull()
      .default('draft'),
    createdAt: text('created_at').notNull(),
  },
  (t) => [
    index('assets_public_page').on(t.visibility, t.publicationStatus, t.id),
    index('assets_ruleset_page').on(t.rulesetId, t.type, t.id),
    check('asset_type', sql`${t.type} = 'spell'`),
    check('asset_origin', sql`${t.origin} = 'synthetic'`),
    check(
      'asset_visibility',
      sql`${t.visibility} IN ('private', 'campaign', 'public')`,
    ),
    check('asset_status', sql`${t.publicationStatus} IN ('draft', 'demo')`),
  ],
);
export const assetVersions = sqliteTable(
  'asset_versions',
  {
    id: text('id').primaryKey(),
    assetId: text('asset_id')
      .notNull()
      .references(() => assets.id),
    versionNumber: integer('version_number').notNull(),
    schemaVersion: text('schema_version', { enum: ['1'] }).notNull(),
    definition: text('definition_json', { mode: 'json' })
      .$type<Asset['definition']>()
      .notNull(),
    displayText: text('display_text').notNull(),
    license: text('license', { enum: ['CC0-1.0'] }).notNull(),
    sourceLocator: text('source_locator', {
      enum: ['Original synthetic fixture; not SRD content'],
    }).notNull(),
    createdAt: text('created_at').notNull(),
  },
  (t) => [
    uniqueIndex('asset_version_number').on(t.assetId, t.versionNumber),
    check('positive_version', sql`${t.versionNumber} > 0`),
    check('valid_definition', sql`json_valid(${t.definition})`),
  ],
);
