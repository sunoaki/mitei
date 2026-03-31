# Server Module

## Purpose

The server module exposes Mitei capabilities over service interfaces:

- HTTP API (Fastify + auth + RBAC/resource rules)
- WHOIS server (TCP text protocol query)

## Submodules

- `src/server/http-api`
    - `index.ts`: process entry for standalone HTTP server.
    - `server.ts`: wiring of `Mitei`, auth plugin, user store, and routes.
    - `auth/*`: token verification, scope resolution, permission checks.
    - `user/*`: user CRUD, role/scope management, persistence.
    - `resources/*`: sync and IRR object APIs.
- `src/server/whois`
    - `index.ts`: WHOIS query parser + selector-based query execution.
    - `manual.ts`: local startup example against test DB.

## API/Auth Model (HTTP)

1. Verify bearer token.
2. Map principal to local user record.
3. Compute effective scopes (role + grants - denies, intersect token scopes).
4. Enforce global scopes and per-object resource rules.
