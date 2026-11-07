---
name: feature-planning
description: Use when asked to plan, design, scope, break down, or prepare an implementation for a non-trivial feature or change.
---

# Feature Planning

Translate requirements into an implementation plan grounded in the repository.

## Procedure
1. Restate the requested behavior as acceptance criteria.
2. Locate affected modules and existing patterns.
3. Identify API, database, UI, auth, validation, and deployment impacts.
4. Identify edge cases and backward-compatibility concerns.
5. Define test scenarios, including failure paths.
6. Break work into independently verifiable steps.
7. State assumptions and unresolved questions.

## Output
Return:
- scope
- affected files/modules
- data/API contract changes
- implementation steps
- test plan
- migration/rollback plan if relevant
- risks

## Ngôn ngữ bắt buộc

- Phản hồi người dùng bằng tiếng Việt.
- Báo cáo, finding, explanation, plan và recommendation phải bằng tiếng Việt.
- Giữ nguyên technical terms phổ biến bằng English khi cần.
- Không dịch code, identifier, package name, API route, database name, CLI command, log hoặc error message.
