# Core Module

## Purpose

The core module is the in-memory IRR domain engine. It owns object registration,
indexing, querying, and sync orchestration.

## Main Entry

- `src/core/index.ts`: exports `Mitei`, the top-level orchestrator.

## Internal Data Flow

1. `Mitei.registerSyncer(name, syncer)` registers syncer instances.
2. `Mitei.syncASSets(syncerId)` compares remote and local AS-SET objects.
3. Newer object state wins; local or remote is patched/replaced accordingly.
4. `IRRManager` keeps indexes consistent for fast selector queries.

## Dependencies

- Runtime dependency on `src/syncer/types.ts` (`Syncer` interface).
- Consumed by `src/server/http-api` and `src/server/whois`.
