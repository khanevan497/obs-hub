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
