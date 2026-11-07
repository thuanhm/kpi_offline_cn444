---
name: tdd
description: Use when asked to develop test-first, add regression tests, strengthen coverage, or implement behavior with tests.
---

# TDD

Use red-green-refactor for behavior changes.

## Procedure
1. Define observable behavior and acceptance criteria.
2. Add the smallest failing test.
3. Run it and confirm the failure is meaningful.
4. Implement the minimum production change.
5. Run the test to establish green.
6. Refactor without changing behavior.
7. Add boundary, error-path, and regression cases.
8. Run the relevant broader suite.

Prefer tests that assert behavior and contracts rather than implementation details.

## Ngôn ngữ bắt buộc

- Phản hồi người dùng bằng tiếng Việt.
- Báo cáo, finding, explanation, plan và recommendation phải bằng tiếng Việt.
- Giữ nguyên technical terms phổ biến bằng English khi cần.
- Không dịch code, identifier, package name, API route, database name, CLI command, log hoặc error message.
