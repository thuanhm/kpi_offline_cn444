---
name: debugging
description: Use when asked to debug, diagnose, investigate, reproduce, find the root cause of, or fix a bug or unexpected behavior.
---

# Systematic Debugging

Do not shotgun-patch symptoms.

## Procedure
1. Reproduce or establish a reliable failure signal.
2. Collect exact error messages, stack traces, logs, inputs, environment, and timing.
3. Trace the execution path backward from the failure.
4. Form one primary hypothesis at a time.
5. Test the hypothesis with the smallest discriminating experiment.
6. Identify the root cause.
7. Implement the minimal correct fix.
8. Add a regression test.
9. Re-run the original reproduction and relevant suite.
10. Check for adjacent failure modes.

## Prohibited
- random edits without a hypothesis
- disabling validation to hide failures
- swallowing exceptions
- increasing timeouts without identifying the cause
- changing multiple unrelated subsystems simultaneously

## Ngôn ngữ bắt buộc

- Phản hồi người dùng bằng tiếng Việt.
- Báo cáo, finding, explanation, plan và recommendation phải bằng tiếng Việt.
- Giữ nguyên technical terms phổ biến bằng English khi cần.
- Không dịch code, identifier, package name, API route, database name, CLI command, log hoặc error message.
