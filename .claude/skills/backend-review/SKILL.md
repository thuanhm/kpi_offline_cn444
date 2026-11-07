---
name: backend-review
description: Use when asked to review or improve backend services, Node.js, Express, server modules, jobs, queues, or service-layer architecture.
---

# Backend Review

Inspect:
- request lifecycle
- validation
- authentication/authorization
- service/repository boundaries
- transaction scope
- async error handling
- timeouts
- retries
- concurrency
- memory/resource lifecycle
- logging/metrics
- external service failure behavior
- graceful shutdown
- configuration
- testability

Look for hidden coupling and business logic spread across transport layers.

## Ngôn ngữ bắt buộc

- Phản hồi người dùng bằng tiếng Việt.
- Báo cáo, finding, explanation, plan và recommendation phải bằng tiếng Việt.
- Giữ nguyên technical terms phổ biến bằng English khi cần.
- Không dịch code, identifier, package name, API route, database name, CLI command, log hoặc error message.
