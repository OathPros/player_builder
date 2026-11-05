import { and, asc, eq, gt, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import type { AssetInput, PageInput } from '@rpg-forge/contracts';
import { assets, assetVersions, rulesets } from './schema';

function page<T extends { id: string }>(rows: T[], limit: number) {
  const data = rows.slice(0, limit);
  return { data, nextCursor: rows.length > limit ? data.at(-1)!.id : null };
}
export function createCatalogRepository(binding: D1Database) {
  const db = drizzle(binding);
  return {
    async listRulesets(input: PageInput) {
      const rows = await db
        .select()
        .from(rulesets)
        .where(input.cursor ? gt(rulesets.id, input.cursor) : undefined)
        .orderBy(asc(rulesets.id))
        .limit(input.limit + 1);
      return page(rows, input.limit);
    },
    async listAssets(input: AssetInput) {
      // A closed public/demo scope is mandatory even if callers request other visibility.
      const rows = await db
        .select({
          id: assets.id,
          rulesetId: assets.rulesetId,
          name: assets.name,
          type: assets.type,
          origin: assets.origin,
          visibility: assets.visibility,
          publicationStatus: assets.publicationStatus,
          versionId: assetVersions.id,
          versionNumber: assetVersions.versionNumber,
          schemaVersion: assetVersions.schemaVersion,
          definition: assetVersions.definition,
          displayText: assetVersions.displayText,
          license: assetVersions.license,
          sourceLocator: assetVersions.sourceLocator,
        })
        .from(assets)
        .innerJoin(
          assetVersions,
          and(
            eq(assetVersions.assetId, assets.id),
            sql`${assetVersions.versionNumber} = (SELECT MAX(v.version_number) FROM asset_versions v WHERE v.asset_id = ${assets.id})`,
          ),
        )
        .where(
          and(
            eq(assets.visibility, 'public'),
            eq(assets.publicationStatus, 'demo'),
            input.cursor ? gt(assets.id, input.cursor) : undefined,
            input.rulesetId ? eq(assets.rulesetId, input.rulesetId) : undefined,
            input.type ? eq(assets.type, input.type) : undefined,
            input.q
              ? sql`instr(lower(${assets.name}), lower(${input.q})) > 0`
              : undefined,
          ),
        )
        .orderBy(asc(assets.id))
        .limit(input.limit + 1);
      return page(rows, input.limit);
    },
  };
}

export type CatalogRepository = ReturnType<typeof createCatalogRepository>;
