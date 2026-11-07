---
description: Lập kế hoạch và, sau khi được người dùng phê duyệt, sửa các findings từ Full Audit theo lifecycle Plan → Approval → Fix → Test → Review → Re-audit.
---

# FIX AUDIT — SỬA FINDINGS THEO KIỂM SOÁT

## Ngôn ngữ
Tất cả giao tiếp và báo cáo bằng tiếng Việt. Giữ nguyên code, identifiers, commands, logs và technical terms cần thiết bằng English.

## Nguyên tắc quan trọng
`/fix-audit` KHÔNG được tự động sửa code ở lần chạy đầu tiên.

Nó phải thực hiện:

```text
READ AUDIT
    ↓
CLASSIFY FINDINGS
    ↓
CREATE FIX PLAN
    ↓
STOP + ASK APPROVAL
    ↓
FIX
    ↓
TEST
    ↓
CODE REVIEW
    ↓
RE-AUDIT
```

## PHASE 1 — Đọc audit

Tìm audit report hiện có trong:
- conversation/context
- `AUDIT_REPORT.md`
- `audit-report.md`
- `docs/`
- các file audit liên quan

Nếu không tìm thấy report, yêu cầu chạy `/full-audit` trước.

Không tự tạo findings chỉ để có việc sửa.

## PHASE 2 — Phân loại

Với từng finding:

- `CONFIRMED_DEFECT`
- `DUPLICATE`
- `FALSE_POSITIVE`
- `REQUIRES_MANUAL_VERIFICATION`
- `SAFE_TO_FIX`
- `REQUIRES_APPROVAL`

Không sửa:
- false positive;
- duplicate;
- finding thiếu evidence;
- vấn đề cần quyết định business;
- migration/destructive change nếu chưa được approval.

## PHASE 3 — Dependency analysis

Xác định:
- findings nào có cùng root cause;
- finding nào phụ thuộc finding khác;
- thay đổi nào ảnh hưởng nhiều module;
- thay đổi nào ảnh hưởng database/API/auth;
- thay đổi nào có khả năng breaking change.

Ưu tiên:
1. BLOCKER
2. HIGH
3. MEDIUM
4. LOW

Nhưng dependency/root cause có thể thay đổi thứ tự thực hiện.

## PHASE 4 — FIX PLAN

Tạo kế hoạch bằng tiếng Việt:

# FIX PLAN

## Tổng quan
- BLOCKER:
- HIGH:
- MEDIUM:
- LOW:

## Nhóm thay đổi

### FIX-001
**Findings:** HIGH-001, HIGH-004

**Root cause:**
...

**Files dự kiến thay đổi:**
...

**Cách sửa:**
...

**Tests cần chạy:**
...

**Rủi ro:**
...

**Có thay đổi database/API/auth không:** Có/Không

## Thứ tự thực hiện
1. ...
2. ...

## Các thay đổi cần approval đặc biệt
- database migration
- destructive operation
- public API contract
- authentication/authorization behavior
- production configuration
- dependency major version
- data transformation

SAU KHI IN FIX PLAN, DỪNG LẠI.

Yêu cầu người dùng xác nhận, ví dụ:

> "Kế hoạch trên đã sẵn sàng. Tôi sẽ chỉ bắt đầu sửa sau khi bạn xác nhận."

Không tự chuyển sang PHASE 5.

---

# PHASE 5 — SAU KHI NGƯỜI DÙNG APPROVAL

Chỉ bắt đầu nếu người dùng xác nhận rõ ràng.

Trước khi sửa:
- `git status`
- kiểm tra baseline tests phù hợp;
- đọc lại files/callers;
- kiểm tra current diff.

## Fix từng nhóm

Với mỗi FIX:

```text
Inspect
 ↓
Implement
 ↓
Format/Lint
 ↓
Targeted Test
 ↓
Regression Test
 ↓
Inspect Diff
```

Không sửa unrelated code.

## Regression protection

Nếu finding là bug:
- thêm regression test nếu project có test framework phù hợp;
- không xóa test đang bảo vệ behavior hợp lệ;
- nếu không thể thêm test, giải thích lý do.

## Database

Nếu có migration:
- mô tả migration trước;
- kiểm tra backward compatibility;
- không chạy destructive migration trên production;
- nếu migration nguy hiểm, dừng và yêu cầu approval riêng.

## Security

Không xử lý security finding bằng cách:
- disable authentication;
- disable validation;
- mở CORS toàn bộ;
- hard-code credential;
- tắt security middleware.

---

# PHASE 6 — CODE REVIEW

Sau khi hoàn thành các fixes:

1. chạy `/code-review`;
2. kiểm tra git diff;
3. kiểm tra accidental changes;
4. kiểm tra regression.

Nếu Code Review phát hiện lỗi mới:
- sửa;
- test lại;
- review lại.

---

# PHASE 7 — RE-AUDIT

Cuối cùng chạy `/full-audit`.

Đối chiếu finding cũ:

| Finding | Trạng thái |
|---|---|
| BLOCKER-001 | RESOLVED |
| HIGH-002 | RESOLVED |
| HIGH-003 | OPEN |
| MEDIUM-004 | NOT VERIFIED |

Phải phân biệt:
- `RESOLVED`: đã xác minh không còn;
- `OPEN`: chưa sửa;
- `REGRESSED`: đã sửa nhưng xuất hiện lại;
- `NOT_VERIFIED`: chưa đủ evidence;
- `WONT_FIX`: giữ lại có chủ đích và nêu lý do.

Không được tuyên bố project sạch nếu chưa re-audit.
