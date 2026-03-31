# Access Control Module

## Purpose

The access-control module is a framework-agnostic authorization core shared by
HTTP API and WHOIS.

## Scope

- Scope and role definitions.
- Effective auth context construction.
- Resource-level permission matching and assertions.
- Access-control specific error type (`AccessControlError`).

## Integration

- `src/server/http-api/auth` consumes this module and maps errors to `HttpError`.
- `src/server/whois` consumes this module directly for internal-user based filtering.

## Notes

- Keep this module transport-agnostic.
- Do not introduce Fastify, HTTP, or token verification logic here.
