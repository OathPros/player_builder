import { Hono } from 'hono';
import {
  AssetQuery,
  AssetsResponse,
  HealthResponse,
  PageQuery,
  RulesetsResponse,
} from '@rpg-forge/contracts';
import { createCatalogRepository } from '@rpg-forge/db';

export type Bindings = { DB: D1Database };
const app = new Hono<{ Bindings: Bindings }>();
app.use('/api/*', async (c, next) => {
  c.header('Cache-Control', 'no-store');
  c.header('X-Content-Type-Options', 'nosniff');
  if (!['GET', 'HEAD'].includes(c.req.method)) {
    c.header('Allow', 'GET, HEAD');
    return c.json(
      {
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: 'This foundation API is read-only.',
        },
      },
      405,
    );
  }
  await next();
});
app.get('/api/v1/health', (c) =>
  c.json(
    HealthResponse.parse({ status: 'ok', app: 'rpg-forge', version: '0.1.0' }),
  ),
);
app.get('/api/v1/rulesets', async (c) => {
  const query = c.req.queries();
  if (Object.values(query).some((v) => v.length !== 1))
    return c.json(
      {
        error: {
          code: 'INVALID_QUERY',
          message: 'Query parameters must not be repeated.',
        },
      },
      400,
    );
  const result = PageQuery.safeParse(c.req.query());
  if (!result.success)
    return c.json(
      {
        error: {
          code: 'INVALID_QUERY',
          message: 'Use limit 1–50 and an optional stable ID cursor.',
        },
      },
      400,
    );
  return c.json(
    RulesetsResponse.parse(
      await createCatalogRepository(c.env.DB).listRulesets(result.data),
    ),
  );
});
app.get('/api/v1/assets', async (c) => {
  if (Object.values(c.req.queries()).some((v) => v.length !== 1))
    return c.json(
      {
        error: {
          code: 'INVALID_QUERY',
          message: 'Query parameters must not be repeated.',
        },
      },
      400,
    );
  const result = AssetQuery.safeParse(c.req.query());
  if (!result.success)
    return c.json(
      {
        error: {
          code: 'INVALID_QUERY',
          message:
            'Invalid filter or pagination. Only public demo spells are available; limit must be 1–50.',
        },
      },
      400,
    );
  return c.json(
    AssetsResponse.parse(
      await createCatalogRepository(c.env.DB).listAssets(result.data),
    ),
  );
});
app.notFound((c) =>
  c.json({ error: { code: 'NOT_FOUND', message: 'Route not found.' } }, 404),
);
app.onError((_error, c) =>
  c.json(
    {
      error: {
        code: 'INTERNAL_ERROR',
        message:
          'Unable to read the catalog. Check the database migration and binding.',
      },
    },
    500,
  ),
);
export default app;
