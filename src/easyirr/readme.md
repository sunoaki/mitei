# EasyIRR Module

## Purpose

The easyirr module provides YAML-friendly abstractions for building and refreshing
AS-SET content, then mapping it to core IRR objects.

## Main Entry

- `src/easyirr/AS_SET/index.ts`

## Typical Workflow

1. Parse YAML via `parseContent`.
2. Register content into `EasyASSetObject`.
3. Call `refreshAll()` to generate and apply patches.
4. Use resulting object with core IRR manager or syncers.

## Dependencies

- Depends on `src/core/IRR/AS_SET/*` for canonical object/content models.
- Depends on `src/irrd-client` for AS-SET member expansion in member logic.
