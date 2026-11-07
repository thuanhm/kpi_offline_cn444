---
name: audit-fix-lifecycle
description: Use when managing the complete lifecycle from repository audit through approved fixes, testing, code review, and re-audit.
---

# Audit → Fix → Verify → Re-audit

## Mục tiêu

Đảm bảo mọi thay đổi bắt nguồn từ audit đều có:
- evidence;
- plan;
- approval;
- controlled implementation;
- tests;
- review;
- re-audit.

## State machine

```text
AUDIT
  ↓
PLANNED
  ↓
AWAITING_APPROVAL
  ↓
APPROVED
  ↓
IN_PROGRESS
  ↓
TESTED
  ↓
REVIEWED
  ↓
RE_AUDITED
  ↓
RESOLVED / OPEN / REGRESSED / NOT_VERIFIED
```

## Quy tắc

- Không bỏ qua approval đối với `/fix-audit`.
- Không sửa finding nếu chưa xác minh.
- Không đánh dấu resolved chỉ vì code đã thay đổi.
- Re-audit là bắt buộc đối với thay đổi có nguồn gốc từ full audit.
- Database/auth/API breaking changes cần approval rõ ràng.
