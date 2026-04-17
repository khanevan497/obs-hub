# Changelog

All notable changes to this project are documented here.

### 2024-10-31

**feat: NestJS API scaffold with TypeORM and PostgreSQL**

NestJS 10 with TypeORM entities for Organization, User, Project, Log, Metric, Error, AlertRule, AlertIncident.

### 2024-11-19

**feat: BullMQ queue setup with three named Redis-backed queues**

Three queues: logs, metrics, errors. Workers process jobs async with exponential backoff on failure.

### 2024-11-27

**feat: log ingestion endpoint with schema validation and 202 response**

POST /api/v1/ingest/logs validates schema, pushes to BullMQ logs queue, returns 202 immediately.

### 2024-12-01

**feat: metrics ingestion with time-series storage**

Metrics stored with timestamp, name, value, service, and tags columns. Supports batch submission.

### 2025-02-10

**feat: error ingestion with SHA256 fingerprint grouping**

Fingerprint = SHA256(error_type + normalized_message + top 3 stack frames). Groups identical errors.

### 2025-02-16

**feat: JWT authentication with organization_id encoded in token**

JWT encodes organizationId. All query endpoints scope to organization from token, never request body.

### 2025-03-18

**feat: API key authentication with bcrypt hash storage**

API keys stored as bcrypt hashes. Plaintext shown only at creation. Format: obs_xxx prefix.

### 2025-03-19

**feat: Redis rate limiting at 10000 events per minute per project**

Rate limit checked per (project_id, minute). Returns 429 with Retry-After header on breach.

### 2025-03-21

**feat: log query endpoint with field filter syntax**

Supports level:error service:api environment:production plus free-text. Paginated with limit and offset.

### 2025-03-26

**feat: error groups endpoint with occurrence counts**

GET /api/v1/errors/groups returns fingerprints with count, first_seen, last_seen, example stack trace.

### 2025-04-02

**feat: metrics aggregation with date_trunc time bucketing**

Aggregation options: avg, sum, count. Time buckets via date_trunc for minute, hour, day granularity.

### 2025-04-15

**feat: alert rule evaluation triggered after every metrics batch**

Worker evaluates all enabled AlertRules for project after processing each metrics job.

### 2025-05-02

**feat: alert incident deduplication per alert rule**

Only one active incident per alert rule at a time. New incident only if no existing triggered incident.

### 2025-05-02

**feat: WebSocket real-time events via Socket.io org rooms**

Each org gets a Socket.io room. Workers emit log_created, metric_ingested, alert_triggered, alert_resolved.

### 2025-05-04

**feat: dashboard summary endpoint with key metrics**

Returns total logs errors metrics today, active alert count, and ingestion rate per project.

### 2025-06-08

**feat: queue health monitoring endpoint**

GET /api/v1/queue/health returns waiting active failed counts for each of the three queues.

### 2025-06-09

**feat: React dashboard with TanStack Query and Recharts**

Dashboard page with summary cards and ingestion rate sparklines. Auto-refreshes every 30 seconds.

### 2025-06-15

**feat: logs page with full-text search and level filter**

Search bar sends query to GET /api/v1/logs. Level filter chips for DEBUG INFO WARN ERROR.

### 2025-07-09

**feat: error groups page with stack trace viewer**

Error groups table with count and last-seen. Click to expand full stack trace and occurrence list.

### 2025-07-28

**feat: metrics page with time-series line charts**

Recharts LineChart per metric name. Time range picker for 1h 6h 24h 7d. Aggregation toggle.

### 2025-08-10

**feat: alerts management page with create and delete**

Form to create alert rule with metric name, condition, threshold, window, severity. List with delete.

### 2025-08-14

**feat: projects management page with API key display**

Create project with name, slug, environment. API key shown once on creation with copy button.

### 2025-10-01

**fix: resolve log ingestion message loss under concurrent load**

Worker concurrency was too high causing DB write contention. Reduced to 5 concurrent workers per queue.

### 2025-10-29

**feat: idempotent ingestion via event_id deduplication**

INSERT ON CONFLICT (project_id, event_id) DO NOTHING. Duplicate submissions silently ignored.

### 2025-11-25

**fix: fix metrics aggregation off-by-one in time window boundary**

Window end was exclusive but query used <=. Changed to < end to match exclusive boundary semantics.

### 2025-12-13

**feat: nightly cron job for log metrics and error retention**

Cron at 02:00 UTC deletes logs > 7 days, metrics > 30 days, errors > 30 days.

### 2025-12-21

**chore: Docker Compose orchestrating API frontend PostgreSQL Redis**

docker-compose.yml with health checks and depends_on ordering. All services on shared network.

### 2026-01-23

**perf: add pg_trgm GIN index for log full-text search**

CREATE INDEX ON logs USING GIN (message gin_trgm_ops). ILIKE queries now use index scan.

### 2026-02-12

**fix: fix WebSocket room scoping leaking events across organizations**

Room name changed from project slug to organization UUID. Prevents cross-org event leakage.

### 2026-02-16

**feat: error stack trace parsing and normalized display**

Stack frames parsed into file, line, function columns. Displayed as formatted table in error detail.

### 2026-02-22

**feat: log detail page with metadata JSON viewer**

Log detail shows all fields plus metadata as collapsible JSON tree viewer.

### 2026-02-28

**docs: document ingestion API with curl examples**

README section with curl examples for log metrics and error ingestion including rate limit behavior.

### 2026-03-11

**refactor: extract queue factory to shared QueueModule**

QueueModule exports BullMQ queues with consistent config. Imported by ingestion, alerts, and demo modules.

### 2026-03-21

**feat: self-monitoring telemetry emitted through own ingestion pipeline**

Platform emits ingestion.requests, queue.depth, worker.failures, api.latency metrics to itself.

### 2026-03-22

**fix: fix Redis rate limit key not expiring correctly**

EXPIRE was called before SET in some code paths. Rewrote as single SET with EX option.

### 2026-03-25

**feat: demo telemetry generator with random latency spikes**

npm run demo streams logs metrics and errors to platform. Includes random p99 latency spikes.

### 2026-04-05

**feat: alert severity levels critical warning and info**

Alert rules now have severity field. Dashboard shows critical alerts prominently with red badge.

### 2026-04-17

**fix: resolve TypeORM connection pool leak on high ingestion**

Workers were not releasing connections on error. Added finally block to release in all worker handlers.
