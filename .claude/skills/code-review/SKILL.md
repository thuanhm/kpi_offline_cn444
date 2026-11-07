---
name: code-review
description: Use when asked to review code, review a diff, audit a pull request, assess quality, or find defects before merge.
---

# Code Review

Review behavior, correctness, security, architecture, maintainability, and tests.

## Review order
1. correctness and regressions
2. security
3. data integrity
4. API/contracts
5. concurrency/state
6. performance
7. architecture/maintainability
8. tests
9. readability

For every finding include severity, file:line, evidence, impact, and remediation.

Do not report style preferences as defects unless they violate an established project rule.
Do not rubber-stamp code merely because tests pass.

## Ngôn ngữ bắt buộc

- Phản hồi người dùng bằng tiếng Việt.
- Báo cáo, finding, explanation, plan và recommendation phải bằng tiếng Việt.
- Giữ nguyên technical terms phổ biến bằng English khi cần.
- Không dịch code, identifier, package name, API route, database name, CLI command, log hoặc error message.
