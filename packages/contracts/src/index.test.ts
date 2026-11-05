import { describe, expect, it } from 'vitest';
import {
  AssetId,
  AssetQuery,
  DemoDefinition,
  HealthResponse,
  PageQuery,
  RulesetId,
} from './index';

describe('shared contracts', () => {
  it('accepts the exact health response', () => {
    expect(
      HealthResponse.parse({
        status: 'ok',
        app: 'rpg-forge',
        version: '0.1.0',
      }),
    ).toEqual({ status: 'ok', app: 'rpg-forge', version: '0.1.0' });
  });
  it.each([
    { status: 'ok' },
    { status: 'ok', app: 'rpg-forge', version: '0.2.0' },
    { status: 'ok', app: 'rpg-forge', version: '0.1.0', extra: true },
  ])('rejects invalid health payloads', (value) => {
    expect(HealthResponse.safeParse(value).success).toBe(false);
  });
  it('validates stable IDs independently from display names', () => {
    expect(RulesetId.parse('dnd5e-2024-srd')).toBe('dnd5e-2024-srd');
    expect(AssetId.parse('demo-synthetic-spark')).toBe('demo-synthetic-spark');
    for (const value of [
      '',
      'Spell Name',
      '../private',
      "x';DROP TABLE assets;--",
    ])
      expect(AssetId.safeParse(value).success).toBe(false);
  });
  it('defaults and bounds pagination', () => {
    expect(PageQuery.parse({})).toEqual({ limit: 20 });
    expect(PageQuery.parse({ limit: '50', cursor: 'demo-a' })).toEqual({
      limit: 50,
      cursor: 'demo-a',
    });
    for (const limit of ['0', '-1', '51', '1.5', '1e1', 'Infinity', '0002', ''])
      expect(PageQuery.safeParse({ limit }).success).toBe(false);
  });
  it('rejects unsupported filters and private reads', () => {
    for (const value of [
      { visibility: 'private' },
      { type: 'class' },
      { page: '1' },
      { q: '' },
      { q: 'x'.repeat(101) },
      { cursor: '../' },
    ])
      expect(AssetQuery.safeParse(value).success).toBe(false);
  });
  it('does not allow the demonstration definition to become executable or SRD content', () => {
    const demo = {
      schemaVersion: '1',
      kind: 'spell',
      synthetic: true,
      description: 'Original fixture',
      executable: false,
    };
    expect(DemoDefinition.safeParse(demo).success).toBe(true);
    expect(
      DemoDefinition.safeParse({ ...demo, executable: true }).success,
    ).toBe(false);
    expect(
      DemoDefinition.safeParse({ ...demo, synthetic: false }).success,
    ).toBe(false);
  });
});
