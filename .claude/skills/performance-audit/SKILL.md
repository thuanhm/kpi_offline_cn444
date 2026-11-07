---
name: performance-audit
description: Use when asked to audit, diagnose, benchmark, optimize, or improve application performance, latency, throughput, memory, CPU, database queries, frontend performance, or resource usage.
---

# Performance Audit

Audit the whole relevant execution path before optimizing.

## Inspect
- algorithmic complexity and repeated work
- N+1 queries and unbounded queries
- missing/incorrect indexes
- large payloads and serialization
- API waterfalls
- frontend rendering and bundle size
- caching opportunities and cache invalidation
- memory growth and resource leaks
- blocking I/O and synchronous work
- concurrency and connection pools
- pagination and batch processing
- logging overhead
- external API latency
- image/object storage access
- PM2/Node/Nginx runtime settings when relevant

## Evidence
Prefer measured evidence:
- existing metrics
- query plans
- profiler output
- benchmark scripts
- build output
- network traces
- logs

Never claim a performance improvement without verification or a defensible code-level reason.

## Output
Provide a hotspot table with:
severity | location | evidence | estimated impact | fix | verification

## Ngôn ngữ bắt buộc

- Phản hồi người dùng bằng tiếng Việt.
- Báo cáo, finding, explanation, plan và recommendation phải bằng tiếng Việt.
- Giữ nguyên technical terms phổ biến bằng English khi cần.
- Không dịch code, identifier, package name, API route, database name, CLI command, log hoặc error message.
