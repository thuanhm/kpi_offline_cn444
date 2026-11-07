---
description: Kiểm tra toàn bộ repository về architecture, correctness, security, performance, database, API, frontend/backend, testing và maintainability. Mặc định chỉ đọc.
---

# FULL AUDIT — KIỂM TRA TOÀN BỘ PROJECT

## Nguyên tắc bắt buộc
- Phản hồi và báo cáo bằng tiếng Việt.
- Audit TOÀN BỘ repository, không giới hạn ở file đang mở.
- Mặc định READ-ONLY.
- Không sửa code nếu người dùng chưa yêu cầu.
- Không dùng numeric score tổng thể.

## Giai đoạn 0 — Baseline
Kiểm tra:
- `git status --short`
- branch hiện tại
- package manager
- package scripts
- framework/runtime
- test/build commands

## Giai đoạn 1 — Discovery
Kiểm tra:
- root structure
- source directories
- tests
- package manifests/lockfiles
- database/schema/migrations
- API routes/controllers
- frontend routes/components
- authentication/authorization
- configuration/env examples
- Docker/CI/CD
- PM2/Nginx/deployment
- storage
- logging/observability

Tạo repository map nội bộ trước khi kết luận.

## Giai đoạn 2 — Architecture & Code Quality
Áp dụng:
- project-analysis
- architecture-review
- code-review
- frontend-review
- backend-review

Kiểm tra:
- correctness
- coupling/cohesion
- duplication
- dead code
- circular dependencies
- error handling
- type safety
- state management
- business logic placement

## Giai đoạn 3 — Database & API
Áp dụng:
- database-review
- api-review

Kiểm tra:
- schema
- constraints
- indexes
- N+1
- transaction
- locking
- migration safety
- API contract
- validation
- authorization
- pagination
- error model
- backward compatibility

## Giai đoạn 4 — Security
Áp dụng security-audit.

Kiểm tra toàn bộ attack surface theo hướng defensive.

## Giai đoạn 5 — Performance
Áp dụng performance-audit.

Phân biệt:
- vấn đề đã đo được;
- risk/hypothesis từ static analysis.

## Giai đoạn 6 — Testing & Verification
Tìm test scripts trong package/CI.
Chạy các kiểm tra an toàn và phù hợp:
- lint
- typecheck
- unit
- integration
- E2E
- build

Không chạy destructive command trên production.

## Giai đoạn 7 — Consolidation
Deduplicate findings.

Mỗi finding:
- ID
- Severity
- Category
- File:Line
- Evidence
- Impact
- Recommendation
- Confidence
- Verification status

## Giai đoạn 8 — Báo cáo tiếng Việt

# BÁO CÁO FULL PROJECT AUDIT

## 1. Tổng quan hệ thống
## 2. Stack công nghệ
## 3. Kiến trúc hiện tại
## 4. Frontend
## 5. Backend
## 6. Database
## 7. API
## 8. Security
## 9. Performance
## 10. Testing
## 11. Dependency & Configuration
## 12. Findings

### BLOCKER
### HIGH
### MEDIUM
### LOW
### INFO

## 13. Các vấn đề cần ưu tiên
## 14. Kế hoạch khắc phục
## 15. Các command đã chạy
## 16. Các vấn đề chưa thể xác minh

Không biến hypothesis thành confirmed defect.
