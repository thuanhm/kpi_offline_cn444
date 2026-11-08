# BÁO CÁO SỬ DỤNG SKILLS, AGENTS, MCP

## Đã khảo sát
Danh sách Skills của phiên làm việc (cấp người dùng, plugin và dự án), trong đó `.claude/skills/` của dự án có: `claude-dashboard`, `claude-design-system`, `claude-design`, `dataviz` (các thư mục này chưa được đưa vào git). Agent có sẵn: general-purpose, Explore, Plan, code-reviewer, debugger, full-auditor, v.v. MCP: Claude Docs, Make và các máy chủ cần xác thực/không kết nối được (không dùng).

## Đã đọc hướng dẫn và áp dụng thực tế
| Skill | Đã đọc | Áp dụng |
|---|---|---|
| `dataviz` | Có (SKILL.md, đầu phiên) | Quy tắc "màu theo chức năng": Heatmap = thang liên tục theo mức độ hoàn thành, tách khỏi màu thương hiệu; kiểm tương phản chữ/nền bằng tính toán (≥ 4,5:1) thay vì đoán; chú giải liên tục; chuỗi phụ dùng màu trung tính. Chưa chạy `validate_palette.js` (dành cho bảng màu phân loại, không phải thang liên tục). |

## Đã đọc nhưng không áp dụng
`claude-dashboard`, `claude-design-system`: tạo dashboard/design system dạng artifact tách rời, không phù hợp với việc sửa ứng dụng hiện có; không chạy các script của hai skill này. `claude-design`, `design:*`, `frontend-review`, `testing`, `code-review`...: chỉ có tên và mô tả trong danh sách, **chưa đọc SKILL.md và chưa sử dụng** — không tuyên bố đã áp dụng.

## Agent / MCP
Không dùng Agent con (công việc tuần tự, nhiều file dùng chung, tránh xung đột) — thực hiện lần lượt theo vai trò: khảo sát → token → chrome → Heatmap → kiểm thử. Không dùng MCP tool; không gửi dữ liệu ra ngoài. Kiểm thử bằng Edge headless (CDP) viết sẵn trong `tests/lib/browser.mjs`.

## Hạn chế
Thứ tự "khảo sát Skills trước khi sửa mã" chỉ thực hiện được ở mức danh sách có sẵn trong phiên; việc đọc đầy đủ mọi Skill liên quan UI/QA chưa làm. Chưa có công cụ kiểm tra thị giác tự động ngoài chụp ảnh và so sánh bằng mắt.

## Cập nhật 08/11/2026 — Đồng bộ màu trạng thái + Continuous Heatmap

| Skill / Công cụ | Đã đọc | Áp dụng |
|---|---|---|
| `implementation` (dự án) | Có (được gọi qua `/implementation`) | Làm theo kiến trúc sẵn có (token CSS, `VTB.*`, `MOI_DATA`), không thêm phụ thuộc. Kiểm tra cú pháp `node --check`, chạy test đích, E2E, xem lại `git diff`. |
| `dataviz` (dự án) | Có (SKILL.md) | Màu theo chức năng: trạng thái (5 màu rời, kèm biểu tượng + nhãn) tách khỏi thang liên tục (mức độ hoàn thành). Tính tương phản bằng mã (`MOI_HEAT.contrast`). **Đã chạy `scripts/validate_palette.js`** cho 5 điểm của thang: phát hiện ΔE vàng↔xanh vàng = 5,2 (protan) → ghi nhận là giới hạn, bù bằng số + nhãn (kiểm tra lightness/categorical không áp dụng cho thang tuần tự). |
| `claude-design-system`, `claude-dashboard`, `claude-design` | Chỉ phần mô tả | Không áp dụng: tạo artifact tách rời, không sửa ứng dụng hiện có. |
| Agent con / MCP | — | Không dùng: các file CSS/JS dùng chung chồng lấn nhiều, làm tuần tự để tránh xung đột. Không dùng MCP, không gửi dữ liệu ra ngoài. |
| Công cụ kiểm thử | — | Edge headless qua `tests/lib/browser.mjs` (sẵn có); thêm `tests/browser-heatmap.mjs`, `tests/screenshots-trang-thai.mjs`. |

Hạn chế: các skill `design:accessibility-review`, `frontend-review`, `testing` chỉ xem tên/mô tả, chưa đọc SKILL.md — không tuyên bố đã áp dụng.
