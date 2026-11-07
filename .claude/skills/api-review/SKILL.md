---
name: api-review
description: Use when asked to design, review, implement, document, secure, or optimize REST, GraphQL, RPC, or internal service APIs.
---

# API Review

Review API contracts end-to-end.

Check:
- route naming and HTTP semantics
- request validation
- response schemas
- authentication/authorization
- idempotency
- pagination/filtering/sorting
- error model
- versioning/backward compatibility
- rate limits
- timeouts
- retries
- transaction boundaries
- observability
- sensitive-field exposure

Trace each public endpoint to its actual handler and data access.

## Ngôn ngữ bắt buộc

- Phản hồi người dùng bằng tiếng Việt.
- Báo cáo, finding, explanation, plan và recommendation phải bằng tiếng Việt.
- Giữ nguyên technical terms phổ biến bằng English khi cần.
- Không dịch code, identifier, package name, API route, database name, CLI command, log hoặc error message.
