# Syncer Module

## Purpose

The syncer module defines and implements external IRR synchronization adapters.
A syncer bridges remote registry APIs and local core AS-SET objects.

## Main Entry

- `src/syncer/types.ts`: `Syncer` interface contract.

## Integration Points

- Registered into `Mitei` through `registerSyncer`.
- Triggered by `Mitei.syncASSets` and HTTP endpoint `POST /api/v1/syncers/:id/sync`.
