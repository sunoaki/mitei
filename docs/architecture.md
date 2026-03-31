# Mitei Architecture

## Overview

This document summarizes module interactions in the Mitei codebase.
The diagram is optimized for coding agents to quickly locate change impact.

```mermaid
flowchart LR
    subgraph ServiceLayer[Service Layer]
        HTTP[server/http-api]
        WHOIS[server/whois]
    end

    subgraph SharedLayer[Shared Logic Layer]
        ACL[access-control]
    end

    subgraph DomainLayer[Domain Layer]
        CORE[core]
        EIRR[easyirr]
    end

    subgraph AdapterLayer[Adapter Layer]
        IRRD[irrd-client]
        SYNC[syncer]
        ARIN[syncer/ARIN]
    end

    subgraph SupportLayer[Support Layer]
        TESTU[test-utils]
    end

    HTTP --> CORE
    WHOIS --> CORE
    HTTP --> ACL
    WHOIS --> ACL

    EIRR --> CORE
    EIRR -. optional query .-> IRRD

    CORE -->|Syncer interface| SYNC
    SYNC --> ARIN
    ARIN -->|REST/XML| EXTARIN[(ARIN Registry API)]

    IRRD -->|GraphQL| EXTIRRD[(IRRd)]

    TESTU -. shared test doubles .-> CORE
    TESTU -. shared test doubles .-> EIRR
    TESTU -. shared test doubles .-> IRRD
    TESTU -. shared test doubles .-> SYNC
    TESTU -. shared test doubles .-> HTTP
    TESTU -. shared test doubles .-> WHOIS
```

## Practical Notes For Agents

- Core changes usually affect both HTTP and WHOIS behavior.
- Sync behavior changes usually touch both core and syncer/ARIN.
- EasyIRR parsing or expansion changes may involve irrd-client.
- For authorization and resource rules, focus in src/access-control first.
- For token verification and HTTP auth integration, focus in server/http-api/auth.

## Fast Entry Paths

- IRR object logic: src/core/IRR/AS_SET, src/core/IRR/manager
- Sync pipeline: src/core/index.ts, src/syncer/types.ts, src/syncer/ARIN/arin-client.ts
- Authorization core: src/access-control
- HTTP auth integration: src/server/http-api/auth, src/server/http-api/user
- WHOIS query behavior: src/server/whois/index.ts
