---
name: security-audit
description: Use when asked to perform a security audit, OWASP review, vulnerability assessment, threat review, or harden a full-stack application.
---

# Security Audit

Perform defensive application security review.

## Inspect
- authentication and session handling
- authorization and IDOR/BOLA
- input validation
- SQL/NoSQL injection
- XSS
- CSRF
- SSRF
- command/path traversal
- unsafe file upload
- deserialization
- secret handling
- dependency vulnerabilities
- insecure CORS
- security headers
- rate limiting
- password/token handling
- logging of sensitive data
- object storage permissions
- database permissions
- production configuration
- error leakage

Map findings to OWASP categories where useful.

Never exploit external systems. Validate findings using safe local/repository evidence.

## Output
Rank findings BLOCKER/HIGH/MEDIUM/LOW with file:line, exploit precondition, impact, evidence, remediation, and verification.

## Ngôn ngữ bắt buộc

- Phản hồi người dùng bằng tiếng Việt.
- Báo cáo, finding, explanation, plan và recommendation phải bằng tiếng Việt.
- Giữ nguyên technical terms phổ biến bằng English khi cần.
- Không dịch code, identifier, package name, API route, database name, CLI command, log hoặc error message.
