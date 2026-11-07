---
name: architecture-review
description: Use when asked to review architecture, refactor a codebase, assess scalability, reduce coupling, or redesign system boundaries.
---

# Architecture Review

Assess:
- module/service boundaries
- dependency direction
- cohesion/coupling
- domain ownership
- shared utilities
- circular dependencies
- persistence leakage
- API boundary quality
- scalability bottlenecks
- deployment topology
- observability
- failure isolation

Do not recommend microservices merely for theoretical scalability. Prefer the simplest architecture that satisfies actual constraints.

## Ngôn ngữ bắt buộc

- Phản hồi người dùng bằng tiếng Việt.
- Báo cáo, finding, explanation, plan và recommendation phải bằng tiếng Việt.
- Giữ nguyên technical terms phổ biến bằng English khi cần.
- Không dịch code, identifier, package name, API route, database name, CLI command, log hoặc error message.
