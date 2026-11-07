---
description: Review code/diff bằng tiếng Việt, tập trung correctness, security, architecture, performance và testing.
---

# CODE REVIEW

Mặc định READ-ONLY.

1. Kiểm tra git status.
2. Kiểm tra git diff.
3. Đọc changed files trong context.
4. Kiểm tra callers và tests.
5. Kiểm tra correctness/regression.
6. Kiểm tra security/data integrity.
7. Kiểm tra API/database compatibility.
8. Kiểm tra concurrency/state.
9. Kiểm tra performance.
10. Kiểm tra maintainability.
11. Kiểm tra test coverage.

## Format

### HIGH — [Mô tả]

**File:** `path/file.ts:line`

**Vấn đề:**
...

**Evidence:**
...

**Ảnh hưởng:**
...

**Khuyến nghị:**
...

**Verification:**
...

Chỉ report actionable findings.
Không biến coding style preference thành defect.
