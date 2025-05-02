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
