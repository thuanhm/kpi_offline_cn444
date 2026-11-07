---
name: implementation
description: Use when asked to implement, modify, refactor, or complete a feature or bug fix in an existing repository.
---

# Implementation

Implement against existing architecture instead of inventing a parallel architecture.

## Rules
- Inspect callers and dependencies before changing interfaces.
- Reuse existing utilities and patterns.
- Keep changes focused.
- Preserve public contracts unless explicitly changing them.
- Validate external input at boundaries.
- Keep business logic out of presentation layers where the architecture separates concerns.
- Handle errors explicitly.
- Avoid premature abstractions.
- Never add a dependency when existing project capabilities are sufficient.

## Verification
After implementation:
1. format/lint relevant files;
2. run type checking;
3. run targeted tests;
4. run integration/E2E tests when affected;
5. run build when practical;
6. inspect git diff for accidental changes.

## Ngôn ngữ bắt buộc

- Phản hồi người dùng bằng tiếng Việt.
- Báo cáo, finding, explanation, plan và recommendation phải bằng tiếng Việt.
- Giữ nguyên technical terms phổ biến bằng English khi cần.
- Không dịch code, identifier, package name, API route, database name, CLI command, log hoặc error message.
