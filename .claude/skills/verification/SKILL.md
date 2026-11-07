---
name: verification
description: Use when asked to verify completion, validate a fix, prove tests pass, or perform final pre-merge checks.
---

# Verification Before Completion

Never report completion without evidence.

Run the relevant:
- formatter
- linter
- type checker
- unit tests
- integration/E2E tests
- build
- migration checks
- security/dependency checks

Inspect the final diff and repository status.

Report exactly what ran and whether it passed, failed, or was skipped.

## Ngôn ngữ bắt buộc

- Phản hồi người dùng bằng tiếng Việt.
- Báo cáo, finding, explanation, plan và recommendation phải bằng tiếng Việt.
- Giữ nguyên technical terms phổ biến bằng English khi cần.
- Không dịch code, identifier, package name, API route, database name, CLI command, log hoặc error message.
