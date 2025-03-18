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
