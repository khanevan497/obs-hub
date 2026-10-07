# Observability Platform

A production-oriented developer observability platform for collecting application logs, metrics, and errors — with a centralised dashboard for searching, monitoring, and alerting. Think a simplified combination of Datadog, Grafana, Sentry, and Better Stack.

## Architecture

```mermaid
graph TD
    A[Application] -->|HTTPS| B[Ingestion API]
    B --> C[Auth / Rate Limit]
    C --> D[BullMQ Queue]
    D --> E[Processing Workers]
    E --> F[(PostgreSQL)]
    F --> G[Query API]
    G --> H[React Dashboard]
    E -->|WebSocket| H
```

### Ingestion flow

```
POST /api/v1/ingest/{logs|metrics|errors}
  → API key auth (obs_xxx token, bcrypt-hashed in DB)
  → Redis rate limit (10,000 events/min/project)
  → Schema validation
  → Push to BullMQ queue
  → Return 202 immediately

Worker picks up job:
  → Upsert to PostgreSQL (idempotent via event_id)
  → Evaluate alert rules (metrics only)
  → Emit WebSocket event to org room
```

### Queue architecture

Three named BullMQ queues backed by Redis: `logs`, `metrics`, `errors`. Workers process jobs asynchronously — the ingestion endpoint never touches the database directly. Jobs retry with exponential backoff on failure.

Queue health is exposed at `GET /api/v1/queue/health`:
```json
{ "logs": { "waiting": 0, "active": 2, "failed": 1 }, ... }
```

### Alert evaluation

After each metrics batch is processed, the worker evaluates all enabled alert rules for the project:

```
For each enabled AlertRule matching the metric name:
  1. Compute aggregate (avg/sum/count) over window_seconds
  2. Compare against threshold using condition (gt/lt/gte/lte)
  3. If breached + no active incident → create AlertIncident, emit alert_triggered
  4. If resolved + active incident exists → resolve incident, emit alert_resolved
```

Only one active incident per alert rule at a time (deduplication by `alert_rule_id + status=triggered`).

### Multi-tenancy

Every resource belongs to an organisation. The JWT encodes `organizationId` — every database query is scoped to it server-side. A user can never read another organisation's data. Project identity on ingestion is resolved from the API key, never from a client-supplied project ID.

```
Organization
├── Users (owner / admin / member / viewer)
├── Projects
│   ├── Logs
│   ├── Metrics
│   └── Errors
└── AlertRules → AlertIncidents
```

### Idempotency

Ingestion endpoints accept an optional `event_id`. The idempotency key is `(project_id, event_id)`. Duplicate submissions are silently ignored via `INSERT ... ON CONFLICT DO NOTHING`.

### Backpressure strategy

The ingestion API is intentionally lightweight — it validates and queues, nothing more. When worker throughput falls behind, queue depth grows but ingestion stays fast. The queue health endpoint surfaces `queue_depth`, `processing_rate`, and `failed_jobs`. Jobs retry with backoff. No distributed flow control is implemented in the MVP.

### Storage decisions

PostgreSQL only for MVP. No Elasticsearch, ClickHouse, or Kafka. The schema is designed so that these can be introduced later:

- Logs → full-text search column is indexed with `pg_trgm` for `ILIKE` queries today, swappable for Elasticsearch later
- Metrics → time-bucketed queries use `date_trunc`, swappable for TimescaleDB/ClickHouse
- The queue abstraction (BullMQ) sits between ingestion and storage, making the storage layer pluggable

### Scaling strategy

**Current (MVP):**
```
NestJS → BullMQ → PostgreSQL
```

**Future path:**
```
Load Balancer → Ingestion Cluster → Kafka → Stream Processing → ClickHouse → Query API
```

No part of the future architecture is implemented here.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, TanStack Query, Tailwind CSS, Recharts |
| Backend | Node.js, NestJS, TypeORM |
| Queue | BullMQ (Redis-backed) |
| Database | PostgreSQL 16 |
| Cache / Rate limiting | Redis 7 |
| Real-time | Socket.io (WebSockets) |
| Auth | JWT (7-day expiry), bcrypt password hashing |
| Containers | Docker, docker-compose |

## Getting started

### With Docker (recommended)

```bash
docker compose up
```

Services:
- Frontend: http://localhost:5173
- API: http://localhost:3000
- PostgreSQL: localhost:5432
- Redis: localhost:6379

Seed demo data (first run):

```bash
curl -X POST http://localhost:3000/api/v1/demo/seed
```

Login: `admin@demo.com` / `demo123`

### Local development

Prerequisites: Node.js 20+, PostgreSQL 16, Redis 7

```bash
# Start infrastructure
docker run -d -e POSTGRES_DB=observability -e POSTGRES_USER=obs \
  -e POSTGRES_PASSWORD=obs_secret -p 5432:5432 postgres:16-alpine
docker run -d -p 6379:6379 redis:7-alpine

# API
cd apps/api
npm install
DATABASE_URL=postgresql://obs:obs_secret@localhost:5432/observability \
  REDIS_URL=redis://localhost:6379 \
  JWT_SECRET=supersecretjwt123 \
  npm run start:dev

# Frontend (separate terminal)
cd apps/web
npm install
npm run dev
```

### Demo application

Run a continuous telemetry generator that emits logs, metrics, and errors to the platform:

```bash
cd apps/api
npm run demo
```

Generates: INFO/WARN/ERROR logs, `api.request.duration`, `api.request.count`, `api.error.count`, `worker.job.count`, `worker.job.duration` — with random latency spikes and failures to demonstrate alerting.

## API reference

### Authentication

```
POST /api/v1/auth/register   Create org + user
POST /api/v1/auth/login      { email, password } → { access_token }
GET  /api/v1/auth/me         Current user (JWT required)
```

### Ingestion (API key auth: `Authorization: Bearer obs_xxx`)

```
POST /api/v1/ingest/logs     { logs: [...], event_id? }
POST /api/v1/ingest/metrics  { metrics: [...] }
POST /api/v1/ingest/errors   { error: {...}, event_id? }
```

Rate limit: 429 if > 10,000 events/min/project.

### Query (JWT auth)

```
GET /api/v1/logs             ?q=level:error service:api&from=ISO&to=ISO&page=1&limit=50
GET /api/v1/logs/:id
GET /api/v1/errors/groups
GET /api/v1/errors/groups/:fingerprint
GET /api/v1/metrics          ?name=api.request.duration&aggregation=avg&from=ISO&to=ISO
GET /api/v1/metrics/names
GET /api/v1/alerts
POST /api/v1/alerts
DELETE /api/v1/alerts/:id
GET /api/v1/alerts/:id/incidents
GET /api/v1/dashboard/summary
GET /api/v1/projects
POST /api/v1/projects
GET /api/v1/queue/health
```

### Log query syntax

```
level:error service:payments environment:production free text terms
```

Supported field filters: `level`, `service`, `environment`, `trace_id`. Free-text terms match against the message column.

## Data model

```
Organization          id, name
User                  id, org_id, name, email, password_hash, role
Project               id, org_id, name, slug, environment, api_key_hash
Log                   id, org_id, project_id, timestamp, level, message,
                      service, environment, trace_id, request_id, metadata, event_id
ErrorEvent            id, org_id, project_id, timestamp, error_type, message,
                      stack_trace, fingerprint, service, environment, trace_id, event_id
Metric                id, org_id, project_id, timestamp, name, value, service, tags
AlertRule             id, org_id, project_id, name, metric_name, condition,
                      threshold, window_seconds, severity, enabled
AlertIncident         id, alert_rule_id, status, triggered_at, resolved_at, current_value
```

**Error fingerprint:** `SHA256(error_type + normalized_message + top 3 stack frames)` — groups identical errors across occurrences.

## Retention

A cron job runs nightly at 02:00 and deletes:
- Logs older than 7 days
- Errors older than 30 days
- Metrics older than 30 days

## Self-monitoring

The platform emits its own telemetry through the ingestion pipeline:

```
ingestion.requests   ingestion.events   ingestion.errors
queue.depth          queue.processing_rate
worker.failures      api.latency        api.errors
```

"The observability platform observes itself."

## Security

- Passwords hashed with bcrypt (cost 12)
- API keys stored as bcrypt hashes, shown in plaintext only at creation time
- JWT signed with HS256, 7-day expiry
- All query endpoints enforce `organization_id` scope from JWT — never from request body
- Input validation via `class-validator` on all DTOs
- Rate limiting on ingestion (Redis) and dashboard APIs (NestJS Throttler)
- Request size limits enforced at the Express layer

## Known limitations

- No email/SMS alerting — incidents appear in-dashboard only
- Full-text log search uses `pg_trgm` `ILIKE`, which degrades at very high log volumes (Elasticsearch would replace this)
- Metrics aggregation is computed at query time from raw rows — a pre-aggregation layer (TimescaleDB continuous aggregates or ClickHouse materialized views) would be needed at scale
- No SSO, billing, or mobile application
- Single-region, single-instance deployment only
