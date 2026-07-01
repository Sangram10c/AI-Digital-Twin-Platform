# System Architecture

## High-Level Architecture

```mermaid
graph TB
    subgraph Client Layer
        FE["Next.js Frontend"]
        VSC["VS Code Extension"]
    end

    subgraph API Layer
        GW["API Gateway / NestJS"]
        WS["WebSocket Gateway"]
    end

    subgraph Service Layer
        AUTH["Auth Service"]
        USER["User Service"]
        DOC["Document Service"]
        AI["AI Service"]
        EMB["Embedding Service"]
        SEARCH["Search Service"]
        NOTIFY["Notification Service"]
    end

    subgraph Data Layer
        PG["PostgreSQL + pgvector"]
        REDIS["Redis"]
        QUEUE["BullMQ"]
        STORE["File Storage"]
    end

    subgraph AI Providers
        OAI["OpenAI"]
        ANT["Anthropic"]
        GEM["Google Gemini"]
        OLL["Ollama"]
    end

    FE --> GW
    FE --> WS
    VSC --> GW

    GW --> AUTH
    GW --> USER
    GW --> DOC
    GW --> AI
    GW --> SEARCH

    AI --> EMB
    AI --> OAI
    AI --> ANT
    AI --> GEM
    AI --> OLL

    AUTH --> PG
    USER --> PG
    DOC --> PG
    EMB --> PG
    SEARCH --> PG

    AUTH --> REDIS
    NOTIFY --> REDIS
    QUEUE --> REDIS

    DOC --> STORE
```

## Architecture Patterns

### Clean Architecture

The platform follows Clean Architecture principles:

- **Domain Layer**: Business entities and rules (innermost)
- **Application Layer**: Use cases and service orchestration
- **Infrastructure Layer**: Database, external APIs, file storage
- **Presentation Layer**: Controllers, gateways, serialization

### Module Architecture

Each feature module is self-contained:

```
module/
├── module.ts         # Module definition
├── controller.ts     # HTTP handlers
├── service.ts        # Business logic
├── dto/              # Data Transfer Objects
├── interfaces/       # TypeScript interfaces
├── types/            # Type definitions
└── constants/        # Module constants
```

### Communication Patterns

| Pattern       | Use Case                           |
| ------------- | ---------------------------------- |
| REST API      | CRUD operations, data fetching     |
| WebSocket     | Real-time updates, notifications   |
| Event-driven  | Background processing, async tasks |
| Message Queue | Heavy processing, retry logic      |

## Scalability Considerations

- **Horizontal Scaling**: Stateless API servers behind a load balancer
- **Database**: Read replicas, connection pooling via PgBouncer
- **Caching**: Redis for session management and hot data
- **Queue**: BullMQ for background job processing
- **CDN**: Static assets served via CDN
- **Vector Search**: pgvector with HNSW indexes for similarity search
