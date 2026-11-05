# Cloudflare deployment setup — not executed

Local dev/build/tests require no Cloudflare account or secrets. The checked-in Worker binding uses the all-zero D1 placeholder ID and `remote: false`; it must not be treated as deployable production configuration. No deployment script, account integration, remote database write, or paid resource was executed in this sprint.

## Required decisions and configuration

Before any resource creation, explicitly authorize the target account, environment and expected costs. Review Cloudflare's current Worker/D1 quotas and billing terms. Start with development/staging and approve production separately. Choose unique Worker names, a domain or workers.dev route, and independent D1 databases for dev, staging and prod. Do not use a single shared DB across environments.

After authorization, a human/operator can create each database, for example from `apps/web`:

```sh
pnpm exec wrangler login
pnpm exec wrangler d1 create rpg-forge-dev
```

Repeat with distinct staging/prod names only as approved. These are **remote resource/account operations**; they were not run. Copy the returned database IDs into the corresponding reviewed Wrangler environment configurations. For each named environment repeat the non-inherited `d1_databases` binding: `binding: DB`, its database name, actual `database_id`, `migrations_dir: ../../packages/db/migrations`. Keep `remote: false` for local use. If using Wrangler `env.dev`, `env.staging`, `env.prod`, give them distinct Worker names and bindings. No named environments are configured yet.

Inspect the generated config to ensure the intended environment was built:

```sh
# From repository root, after reviewed named env configuration exists:
CLOUDFLARE_ENV=dev pnpm build
```

Use the Cloudflare Vite plugin's `CLOUDFLARE_ENV` selector for builds; do not assume a runtime-only environment flag changes an already-built binding. Root build produces client and Worker output under `apps/web/dist`.

## Migrations and deployment (requires separate authorization)

Review generated SQL, take an appropriate backup/export before changing any existing remote database, and test migration/restore in staging. Run remote migrations explicitly, never as part of normal local CI. After reviewed named configuration exists, from `apps/web` the approved dev operation is:

```sh
pnpm exec wrangler d1 migrations apply DB --remote --env dev
```

Do not run the synthetic development seed against staging/production by default. An unseeded catalog returns empty lists. No destructive reset command is part of setup. Document rollback/restore before production; D1 schema migration rollback is not equivalent to Worker rollback.

Only after explicit deployment approval, build the selected environment and deploy its generated Wrangler config (inspect the actual path under `apps/web/dist`, since it follows the Worker/environment name). For the default local-name build that path is `apps/web/dist/rpg_forge/wrangler.json`; it currently contains a placeholder DB ID and must not be deployed. Use `wrangler deploy --config <reviewed-generated-config>` from the repository root only after real configuration and migrations are ready. Do not point Wrangler directly at a TypeScript Worker and accidentally omit the Vite static assets.

## GitHub → Workers Builds

After approval, push the reviewed repository to GitHub, then in Cloudflare Workers & Pages connect the repository using the official [GitHub integration](https://developers.cloudflare.com/workers/ci-cd/builds/git-integration/github-integration/). Select the intended account and branch explicitly. Keep build root at the repository root for pnpm workspaces, use Node 24 and pnpm 11.25.0, install with `pnpm install --frozen-lockfile`, and build with `pnpm build` (set `CLOUDFLARE_ENV` for the configured target). Set the deploy command to `pnpm exec wrangler deploy --config <actual-reviewed-generated-config>`; verify the configured production branch and preview behavior. Separate staging and production build targets rather than sharing database IDs. Do not enable automatic production deployment before authorization.

GitHub Actions in this repository performs verification only. It has read-only repository permission and requires no Cloudflare token. Cloudflare's GitHub connection/account access is configured by the account owner through Cloudflare; no secret values should be pasted into chat or committed. This sprint needs no application secrets or R2 bucket. Add any future secret via Cloudflare secret settings and ignored local `.dev.vars`, never `VITE_*`.

## Post-deploy verification and remaining gates

Check health, rulesets, assets, deep-link SPA routes, JSON API 404s, logs and D1 binding in the selected nonproduction deployment first. Reconfirm that no demo is labeled as imported SRD. Production requires further M11 hardening, operational/backup review, and explicit authorization; passing local foundation tests does not certify production readiness.

References: [React on Workers](https://developers.cloudflare.com/workers/framework-guides/web-apps/react/), [D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/), [D1 limits](https://developers.cloudflare.com/d1/platform/limits/), [Vite plugin](https://developers.cloudflare.com/workers/vite-plugin/).
