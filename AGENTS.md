# AGENTS Guide for Mitei

This document helps coding agents quickly navigate the project and modify the
right places with minimal risk.

## High-Level Architecture

- Core domain engine: `src/core`
- YAML-friendly AS-SET composition: `src/easyirr`
- IRRd GraphQL adapter: `src/irrd-client`
- Shared authorization core: `src/access-control`
- Service layer: `src/server` (HTTP API + WHOIS)
- External registry adapters: `src/syncer`
- Shared test helpers: `src/test-utils`

## Module Dependency Map

- `src/core` depends on `src/syncer/types.ts` (interface only).
- `src/easyirr` depends on `src/core` and may use `src/irrd-client` in members.
- `src/access-control` is framework-agnostic and holds authorization logic.
- `src/server/http-api` depends on `src/core`, `src/access-control`, and auth/user subsystems.
- `src/server/whois` depends on `src/core/IRR/manager/selector` and `src/access-control`.
- `src/syncer` depends on core IRR object types.

## Fast Entry Points by Task

- Add/modify IRR object behavior:
    - `src/core/IRR/AS_SET/*`
    - `src/core/IRR/manager/manager.ts`
- Change sync logic:
    - `src/core/index.ts`
    - `src/syncer/types.ts`
    - `src/syncer/ARIN/arin-client.ts`
- Change authorization and resource-rule logic:
    - `src/access-control/*`
- Change HTTP API/auth behavior:
    - `src/server/http-api/server.ts`
    - `src/server/http-api/auth/*`
    - `src/server/http-api/resources/index.ts`
    - `src/server/http-api/user/*`
- Change WHOIS behavior:
    - `src/server/whois/index.ts`

## Verification Commands

- Full tests: `yarn test`
- Related tests: `yarn test:related`
- Lint: `yarn lint`
- Build: `yarn build`

## Bilingual Module Docs

- `src/core/readme.md` / `src/core/readme_cn.md`
- `src/easyirr/readme.md` / `src/easyirr/readme_cn.md`
- `src/irrd-client/readme.md` / `src/irrd-client/readme_cn.md`
- `src/access-control/readme.md` / `src/access-control/readme_cn.md`
- `src/server/readme.md` / `src/server/readme_cn.md`
- `src/syncer/readme.md` / `src/syncer/readme_cn.md`
- `src/test-utils/readme.md` / `src/test-utils/readme_cn.md`

## Editing Notes for Agents

- Keep public TypeScript APIs stable unless explicitly requested.
- Preserve selector/index semantics in core manager.
- For auth changes, check both scope checks and resource-rule checks.
- Prefer updating tests under the matching module `__tests__` folder.
