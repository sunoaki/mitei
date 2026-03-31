# IRRD Client Module

## Purpose

The irrd-client module is a thin GraphQL client wrapper for querying IRRd.
It focuses on AS-SET and maintainer-related queries used by easyirr and sync logic.

## Main Entry

- `src/irrd-client/index.ts`: exports class `IRRD`.

## Usage Example

- See `src/irrd-client/manual.ts` for a minimal runnable query sample.

## Dependencies

- Uses `@apollo/client/core` and `graphql` ecosystem.
- Consumed by easyirr member resolution and related tests.
