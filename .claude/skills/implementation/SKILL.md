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
- Do the work in the current session; do not spawn subagents for edits you can make directly.
- Read only the files and line ranges you need; keep status updates and the final report short.

## Verification
Scale checks to the change; run each step at most once, after the last edit.
1. Run only the tests that cover the files changed (targeted, not the full suite).
2. Run lint/type check/build only if the project defines that command.
3. Run integration/E2E only when the change touches behavior they cover, not for CSS/docs/text-only edits.
4. Inspect `git diff --stat`, then open the full diff only if it looks larger than expected.
Report any check you skipped and why.

## Ngôn ngữ bắt buộc

- Phản hồi người dùng bằng tiếng Việt.
- Báo cáo, finding, explanation, plan và recommendation phải bằng tiếng Việt.
- Giữ nguyên technical terms phổ biến bằng English khi cần.
- Không dịch code, identifier, package name, API route, database name, CLI command, log hoặc error message.
