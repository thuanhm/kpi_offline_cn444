---
name: database-review
description: Use when asked to review database design, SQL, ORM usage, schema, migrations, indexes, transactions, locking, query performance, or data integrity.
---

# Database Review

Inspect schema, migrations, queries, ORM behavior, constraints, indexes, transaction boundaries, and production safety.

Check:
- primary/foreign keys
- uniqueness and nullability
- indexes aligned to real query predicates
- N+1 access
- transaction isolation
- race conditions
- locking
- migration reversibility
- destructive operations
- backfill strategy
- pagination
- query parameterization
- connection pooling
- data retention

Use EXPLAIN/EXPLAIN ANALYZE only when safe and appropriate.

## Ngôn ngữ bắt buộc

- Phản hồi người dùng bằng tiếng Việt.
- Báo cáo, finding, explanation, plan và recommendation phải bằng tiếng Việt.
- Giữ nguyên technical terms phổ biến bằng English khi cần.
- Không dịch code, identifier, package name, API route, database name, CLI command, log hoặc error message.
