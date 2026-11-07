---
name: testing
description: Use when asked to test, increase coverage, validate behavior, create integration tests, E2E tests, regression tests, or verify a change before completion.
---

# Testing

Select the lowest test level that proves the behavior, then broaden when risk warrants it.

Cover:
- happy path
- boundary values
- validation failures
- authorization failures
- dependency failures
- concurrency-sensitive behavior
- persistence behavior
- API contracts
- UI critical flows

Prefer deterministic tests. Avoid brittle timing and implementation-detail assertions.

## Ngôn ngữ bắt buộc

- Phản hồi người dùng bằng tiếng Việt.
- Báo cáo, finding, explanation, plan và recommendation phải bằng tiếng Việt.
- Giữ nguyên technical terms phổ biến bằng English khi cần.
- Không dịch code, identifier, package name, API route, database name, CLI command, log hoặc error message.
