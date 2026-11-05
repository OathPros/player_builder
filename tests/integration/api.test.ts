import { readFile } from 'node:fs/promises';
import { createTestHarness } from 'wrangler';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  ApiError,
  AssetsResponse,
  HealthResponse,
  RulesetsResponse,
} from '../../packages/contracts/src';
import type { Bindings } from '../../apps/web/worker';

// The built Worker actually executes in workerd; D1 is real local emulation, not a mock.
const server = createTestHarness({
  workers: [{ configPath: 'apps/web/dist/rpg_forge/wrangler.json' }],
});
const worker = server.getWorker<Bindings>();
let db: D1Database;
const seed = await readFile(
  new URL('../fixtures/seed.sql', import.meta.url),
  'utf8',
);
async function seedDatabase() {
  const statements = seed
    .split('--> statement-breakpoint')
    .map((s) => s.trim())
    .filter(Boolean);
  await db.batch(statements.map((statement) => db.prepare(statement)));
}
async function getAssets(query = '') {
  const response = await server.fetch('/api/v1/assets' + query);
  expect(response.status).toBe(200);
  return AssetsResponse.parse(await response.json());
}
beforeAll(async () => {
  await server.listen();
  await worker.applyD1Migrations('DB');
  db = (await worker.getEnv()).DB;
  await seedDatabase();
});
afterAll(async () => {
  await server.close();
});

describe('built Worker and local D1', () => {
  it('returns the exact health contract', async () => {
    const response = await server.fetch('/api/v1/health');
    expect(response.status).toBe(200);
    expect(HealthResponse.parse(await response.json())).toEqual({
      status: 'ok',
      app: 'rpg-forge',
      version: '0.1.0',
    });
  });
  it('reads the one planned ruleset and one synthetic fixture', async () => {
    const response = await server.fetch('/api/v1/rulesets');
    expect(response.status).toBe(200);
    const rulesets = RulesetsResponse.parse(await response.json());
    expect(rulesets.data).toHaveLength(1);
    expect(rulesets.data[0]).toMatchObject({
      id: 'dnd5e-2024-srd',
      version: '5.2.1',
      status: 'planned',
    });
    const assets = await getAssets();
    expect(assets.data).toHaveLength(1);
    expect(assets.data[0]).toMatchObject({
      id: 'demo-synthetic-spark',
      origin: 'synthetic',
      definition: { executable: false },
    });
    expect(assets.nextCursor).toBeNull();
  });
  it('can migrate and seed twice without duplicates or overwriting versions', async () => {
    await worker.applyD1Migrations('DB');
    await seedDatabase();
    await seedDatabase();
    for (const table of ['rulesets', 'assets', 'asset_versions']) {
      expect(
        (
          await db
            .prepare(`SELECT COUNT(*) AS count FROM ${table}`)
            .first<{ count: number }>()
        )?.count,
      ).toBe(1);
    }
  });
  it('filters safely, treating SQL and LIKE wildcard text as literal input', async () => {
    expect(
      (await getAssets('?q=Spark&type=spell&rulesetId=dnd5e-2024-srd')).data,
    ).toHaveLength(1);
    for (const query of ['no-such-name', '%', '_', '\\', "' OR 1=1 --"]) {
      expect((await getAssets('?q=' + encodeURIComponent(query))).data).toEqual(
        [],
      );
    }
    expect((await getAssets('?rulesetId=other-ruleset')).data).toEqual([]);
  });
  it('never exposes private, campaign, or draft assets', async () => {
    try {
      for (const [id, visibility, status] of [
        ['hidden-private', 'private', 'demo'],
        ['hidden-campaign', 'campaign', 'demo'],
        ['hidden-draft', 'public', 'draft'],
      ]) {
        await db
          .prepare(
            'INSERT INTO assets (id, ruleset_id, name, type, origin, visibility, publication_status, created_at) SELECT ?, ruleset_id, name, type, origin, ?, ?, created_at FROM assets WHERE id = ?',
          )
          .bind(id, visibility, status, 'demo-synthetic-spark')
          .run();
        await db
          .prepare(
            'INSERT INTO asset_versions SELECT ?, ?, version_number, schema_version, definition_json, display_text, license, source_locator, created_at FROM asset_versions WHERE id = ?',
          )
          .bind(id + '-v1', id, 'demo-synthetic-spark-v1')
          .run();
      }
      expect((await getAssets()).data.map((a) => a.id)).toEqual([
        'demo-synthetic-spark',
      ]);
    } finally {
      await db
        .prepare("DELETE FROM asset_versions WHERE asset_id LIKE 'hidden-%'")
        .run();
      await db.prepare("DELETE FROM assets WHERE id LIKE 'hidden-%'").run();
    }
  });
  it('paginates with stable IDs and returns one latest version per asset', async () => {
    try {
      await db
        .prepare(
          "INSERT INTO assets SELECT 'demo-z-second', ruleset_id, 'Second test-only fixture', type, origin, visibility, publication_status, created_at FROM assets WHERE id = 'demo-synthetic-spark'",
        )
        .run();
      await db
        .prepare(
          "INSERT INTO asset_versions SELECT 'demo-z-second-v1', 'demo-z-second', version_number, schema_version, definition_json, display_text, license, source_locator, created_at FROM asset_versions WHERE id = 'demo-synthetic-spark-v1'",
        )
        .run();
      await db
        .prepare(
          "INSERT INTO asset_versions SELECT 'demo-synthetic-spark-v2', asset_id, 2, schema_version, definition_json, display_text, license, source_locator, created_at FROM asset_versions WHERE id = 'demo-synthetic-spark-v1'",
        )
        .run();
      const first = await getAssets('?limit=1');
      expect(first.data).toHaveLength(1);
      expect(first.data[0]?.versionNumber).toBe(2);
      expect(first.nextCursor).toBe('demo-synthetic-spark');
      const second = await getAssets('?limit=1&cursor=' + first.nextCursor);
      expect(second.data.map((a) => a.id)).toEqual(['demo-z-second']);
      expect(second.nextCursor).toBeNull();
      expect((await getAssets('?cursor=zzzz')).data).toEqual([]);
    } finally {
      await db
        .prepare(
          "DELETE FROM asset_versions WHERE id IN ('demo-z-second-v1', 'demo-synthetic-spark-v2')",
        )
        .run();
      await db.prepare("DELETE FROM assets WHERE id = 'demo-z-second'").run();
    }
  });
  it('paginates rulesets independently', async () => {
    try {
      await db
        .prepare(
          "INSERT INTO rulesets VALUES ('test-ruleset', 'test', 'Test only', '1', 'planned')",
        )
        .run();
      const first = RulesetsResponse.parse(
        await (await server.fetch('/api/v1/rulesets?limit=1')).json(),
      );
      expect(first.nextCursor).toBe('dnd5e-2024-srd');
      const second = RulesetsResponse.parse(
        await (
          await server.fetch(
            '/api/v1/rulesets?limit=1&cursor=' + first.nextCursor,
          )
        ).json(),
      );
      expect(second.data.map((r) => r.id)).toEqual(['test-ruleset']);
      expect(second.nextCursor).toBeNull();
    } finally {
      await db.prepare("DELETE FROM rulesets WHERE id = 'test-ruleset'").run();
    }
  });
  it.each([
    '/api/v1/assets?limit=0',
    '/api/v1/assets?limit=51',
    '/api/v1/assets?cursor=%27',
    '/api/v1/assets?visibility=private',
    '/api/v1/assets?visibility=campaign',
    '/api/v1/assets?type=class',
    '/api/v1/assets?limit=1&limit=2',
    '/api/v1/assets?q=',
    '/api/v1/rulesets?page=1',
    '/api/v1/rulesets?limit=one',
  ])('rejects invalid query %s', async (url) => {
    const response = await server.fetch(url);
    expect(response.status).toBe(400);
    expect(ApiError.parse(await response.json()).error.code).toBe(
      'INVALID_QUERY',
    );
  });
  it.each(['POST', 'PUT', 'PATCH', 'DELETE'])(
    'rejects %s mutation requests without changing D1',
    async (method) => {
      const response = await server.fetch('/api/v1/assets', {
        method,
        body: '{}',
      });
      expect(response.status).toBe(405);
      expect(response.headers.get('Allow')).toBe('GET, HEAD');
      expect(ApiError.parse(await response.json()).error.code).toBe(
        'METHOD_NOT_ALLOWED',
      );
      expect((await getAssets()).data).toHaveLength(1);
    },
  );
  it('enforces foreign keys', async () => {
    await expect(
      db
        .prepare(
          "INSERT INTO assets VALUES ('orphan', 'missing-ruleset', 'Invalid', 'spell', 'synthetic', 'public', 'demo', 'now')",
        )
        .run(),
    ).rejects.toThrow();
  });
  it('returns JSON 404 for unknown APIs instead of the SPA', async () => {
    for (const path of ['/api', '/api/v1/missing']) {
      const response = await server.fetch(path);
      expect(response.status).toBe(404);
      expect(ApiError.parse(await response.json()).error.code).toBe(
        'NOT_FOUND',
      );
    }
  });
  it('serves the built SPA on direct navigation', async () => {
    const response = await server.fetch('/characters');
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('text/html');
    expect(await response.text()).toContain('RPG Forge');
  });
  it('fails closed with a stable error when D1 is unavailable', async () => {
    // Separate harness, no migrations: tests real missing-schema behavior without damaging other tests.
    const empty = createTestHarness({
      workers: [{ configPath: 'apps/web/dist/rpg_forge/wrangler.json' }],
    });
    try {
      await empty.listen();
      const response = await empty.fetch('/api/v1/assets');
      expect(response.status).toBe(500);
      const body = await response.json();
      expect(ApiError.parse(body).error.code).toBe('INTERNAL_ERROR');
      expect(JSON.stringify(body)).not.toContain('SELECT');
    } finally {
      await empty.close();
    }
  });
});
