# ADR 001 — Single Worker serving SPA + API with D1

Status: accepted for M0/M1.

Use Cloudflare Vite plugin, React + React Router, Hono `/api/v1`, and Drizzle/D1. Static assets and API share one origin and deploy unit. Each future environment gets an independent D1 database; no shared prod/staging state. R2 stays optional until uploads exist.

This keeps local work credential-free and exercises Workers compatibility before deployment. SQLite indexes and bounded keyset pagination support the initial catalog. Data access stays behind a repository boundary so future storage changes do not rewrite HTTP handlers.

Tradeoffs: D1 has platform limits, no conventional cross-request interactive transactions, and requires explicit batch/conditional writes for future concurrent character state. Asset content and version pins are separate. No deployment or account connection is authorized by this ADR.
