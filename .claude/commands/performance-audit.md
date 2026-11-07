---
description: Kiểm tra hiệu năng toàn bộ project bằng tiếng Việt, tập trung frontend, backend, database, runtime và external services.
---

# PERFORMANCE AUDIT

Mặc định READ-ONLY.

## Kiểm tra

### Backend
- algorithmic complexity
- repeated work
- blocking I/O
- event loop
- memory leak
- connection pool
- concurrency
- timeout/retry
- serialization
- payload

### Database
- N+1 query
- missing index
- wrong index
- full scan
- unbounded query
- pagination
- transaction
- locking
- query plan

### Frontend
- unnecessary re-render
- data waterfall
- bundle size
- large dependencies
- client/server boundary
- image loading
- caching
- API calls

### Infrastructure
- Node.js
- PM2
- Nginx
- CPU
- memory
- connection
- compression
- static assets

## Evidence
Ưu tiên:
- metrics
- profiler
- benchmark
- query plan
- build output
- logs
- network trace

Phải phân biệt:
- `CONFIRMED`
- `LIKELY`
- `HYPOTHESIS`

## Báo cáo

# BÁO CÁO PERFORMANCE AUDIT

## Tổng quan
## Critical Path
## Hotspots
## Findings

| Severity | Vị trí | Evidence | Impact | Khuyến nghị | Verification |
|---|---|---|---|---|---|

## Kế hoạch tối ưu
## Kết quả verification
