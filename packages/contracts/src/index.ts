import { z } from 'zod';

export const RulesetId = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9][a-z0-9-]*$/)
  .brand<'RulesetId'>();
export type RulesetId = z.infer<typeof RulesetId>;
export const AssetId = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9][a-z0-9-]*$/)
  .brand<'AssetId'>();
export type AssetId = z.infer<typeof AssetId>;
export const HealthResponse = z
  .object({
    status: z.literal('ok'),
    app: z.literal('rpg-forge'),
    version: z.literal('0.1.0'),
  })
  .strict();
export type HealthResponse = z.infer<typeof HealthResponse>;
export const ApiError = z.object({
  error: z.object({
    code: z.enum([
      'INVALID_QUERY',
      'NOT_FOUND',
      'METHOD_NOT_ALLOWED',
      'INTERNAL_ERROR',
    ]),
    message: z.string(),
  }),
});
export const PageQuery = z
  .object({
    limit: z
      .string()
      .regex(/^[1-9]\d?$/)
      .optional()
      .default('20')
      .transform(Number)
      .pipe(z.number().int().min(1).max(50)),
    cursor: z
      .string()
      .min(1)
      .max(100)
      .regex(/^[a-z0-9][a-z0-9-]*$/)
      .optional(),
  })
  .strict();
export const AssetQuery = PageQuery.extend({
  rulesetId: RulesetId.optional(),
  type: z.enum(['spell']).optional(),
  q: z.string().trim().min(1).max(100).optional(),
  visibility: z.literal('public').optional(),
}).strict();
export type PageInput = z.infer<typeof PageQuery>;
export type AssetInput = z.infer<typeof AssetQuery>;
export const Ruleset = z.object({
  id: RulesetId,
  systemId: z.string(),
  name: z.string(),
  version: z.string(),
  status: z.literal('planned'),
});
export const DemoDefinition = z
  .object({
    schemaVersion: z.literal('1'),
    kind: z.literal('spell'),
    synthetic: z.literal(true),
    description: z.string(),
    executable: z.literal(false),
  })
  .strict();
export const Asset = z.object({
  id: AssetId,
  rulesetId: RulesetId,
  name: z.string(),
  type: z.literal('spell'),
  origin: z.literal('synthetic'),
  visibility: z.literal('public'),
  publicationStatus: z.literal('demo'),
  versionId: z.string(),
  versionNumber: z.number().int().positive(),
  schemaVersion: z.literal('1'),
  definition: DemoDefinition,
  displayText: z.string(),
  license: z.literal('CC0-1.0'),
  sourceLocator: z.literal('Original synthetic fixture; not SRD content'),
});
export type Asset = z.infer<typeof Asset>;
export const RulesetsResponse = z.object({
  data: z.array(Ruleset),
  nextCursor: z.string().nullable(),
});
export const AssetsResponse = z.object({
  data: z.array(Asset),
  nextCursor: z.string().nullable(),
});
