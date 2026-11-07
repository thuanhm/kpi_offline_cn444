---
description: Kiểm tra bảo mật toàn bộ project theo hướng OWASP-oriented và báo cáo bằng tiếng Việt.
---

# SECURITY AUDIT

Mặc định READ-ONLY và defensive.

## Kiểm tra

- authentication
- authorization
- IDOR/BOLA
- input validation
- SQL/NoSQL injection
- XSS
- CSRF
- SSRF
- path traversal
- unsafe file upload
- command injection
- secrets
- dependency vulnerabilities
- CORS
- security headers
- rate limiting
- session/token
- password handling
- object storage permissions
- database permissions
- error leakage
- sensitive logging

## Finding format

### HIGH — [Tên vấn đề]

**File:** `path/file.ts:line`

**Category:** ...

**Điều kiện xảy ra:** ...

**Evidence:** ...

**Ảnh hưởng:** ...

**Khuyến nghị:** ...

**Confidence:** ...

**Verification:** ...

Không exploit external target.
