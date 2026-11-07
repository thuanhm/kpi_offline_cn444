---
description: Debug có hệ thống bằng tiếng Việt, từ reproduction đến root cause, minimal fix và regression verification.
---

# DEBUG

## Quy trình bắt buộc

```text
Reproduce
  ↓
Evidence
  ↓
Trace
  ↓
Hypothesis
  ↓
Experiment
  ↓
Root Cause
  ↓
Minimal Fix
  ↓
Regression Test
  ↓
Verify
```

## Không được
- shotgun patch
- sửa ngẫu nhiên nhiều nơi
- tắt validation để che lỗi
- swallow exception
- tăng timeout mà chưa xác định nguyên nhân
- refactor không liên quan trong lúc fix

## Báo cáo

### 1. Triệu chứng
### 2. Cách tái hiện
### 3. Evidence
### 4. Root cause
### 5. Thay đổi đã thực hiện
### 6. Regression test
### 7. Verification
### 8. Rủi ro còn lại
