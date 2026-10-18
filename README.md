# GEMM32 / ASIC Research

Website nghiên cứu tĩnh cho GEMM INT8 32×32 trên SKY130. Chạy hoàn toàn tại máy; chưa deploy, chưa push GitHub. Không sửa hai tệp nghiên cứu ban đầu hoặc tài liệu ở thư mục cha.

## Chạy website

Cần Node.js20 trở lên. Không có dependency npm, không cần `npm install`.

```powershell
cd 'D:\NGHIEN_CUU_KHOA_HOC\RESFES LẦN 2\WED_ASIC_GEMM'
npm run dev
# Nếu npm chưa nằm trong PATH: node scripts/serve.mjs
```

Mở http://127.0.0.1:4173 . Dừng server bằng Ctrl+C trong terminal đã khởi chạy.

```powershell
npm run check
npm run build
npm run preview
# Các lệnh tương đương không cần npm:
node scripts/check.mjs
node scripts/build.mjs
node scripts/serve.mjs dist
```

Đổi cổng bằng `$env:PORT='4174'` trước khi chạy nếu4173 đã dùng. Để mở nhiều server, đặt biến trong terminal riêng. Production output là `dist/`.

## Cấu trúc

```
index.html                    # Các section, navigation và semantic HTML
src/
  style.css                   # Design tokens, responsive, print, reduced motion
  main.js                     # Systolic demo, tabs, gallery, lightbox, model wrapper
  data.js                     # Baseline, metrics, source references, experiment data
public/
  images/                     # Hai ảnh proposal và screenshot mô hình PE thật
  models/processing-element.html # Bản sao HTML gốc + hai bảo vệ playback
  fonts/                      # Newsreader/Inter/IBM Plex Mono + OFL licenses
  evidence/                   # Hồ sơ nguồn phục vụ preview
  favicon.svg
scripts/
  serve.mjs                   # Local-only HTTP server
  check.mjs                   # Kiểm tra syntax, anchors, file bắt buộc
  build.mjs                   # Kiểm tra rồi tạo website tĩnh dist/
  audit_local.py              # Trích DOCX/XML/media, không cần để chạy website
  fonts.py                    # Tải font và giấy phép, không cần khi chạy website
docs/
  SOURCE_AUDIT.md
  CONTENT_SOURCES.md
  REPOSITORY_FINDINGS.md
  TEST_REPORT.md
  extracted/                  # Văn bản và ảnh trích xuất phục vụ audit
  reference/                  # Bản đọc text nguồn, không vào production bundle
dist/                         # Bản build
```

## Nguồn và cách cập nhật

Baseline là `core_v11`; branch bắt buộc `hierarchical-openlane-flow`, commit `eb8529822c826babe042158af7cd0c3a8f95a25a`. Đọc `docs/CONTENT_SOURCES.md` trước khi sửa claim. Sửa dữ liệu trong `src/data.js`; mỗi metric giữ status, version, note và immutable source link. Điều kiện TT/SS, VCD workload/window và phân biệt core/AXI phải được giữ.

Các con số là kết quả được tài liệu repository báo cáo; website không chạy lại flow ASIC. Demo systolic/hierarchy là conceptual. Mô hình PE có dữ liệu riêng và không xác lập hình học full core_v11. Antenna chưa sạch; 134 GOPS/W là peak/estimated-power, không phải đo silicon hoặc workload efficiency.

Không copy proposal vào public: tránh công bố phần chữ ký và nội dung không cần thiết. Tên nhóm/tác giả/giảng viên lấy đúng từ proposal. Hai ảnh gốc được trích xuất, không crop. Không dùng ảnh website NPU.

## Mô hình3D

`public/models/processing-element.html` bảo tồn file `ProcessingElement 3D (1).html`. WebGL2 tự viết, geometry và signal activity nhúng JSON. Không cần Three.js hay CDN JavaScript. Google Fonts trong mô hình gốc là tùy chọn; có system fallback. UI website tự host font. Chuột kéo xoay, chuột phải kéo pan, wheel/pinch zoom, R reset. Giữ chức năng chọn lớp, tách lớp, lát cắt, cell selection và signal playback. Wrapper khởi tạo ở chế độ3D, thêm fullscreen, loading state và WebGL2 fallback. Nhãn điều khiển mô hình gốc dùng tiếng Việt.

## GitHub Pages (chưa thực hiện)

Build không dùng đường dẫn asset bắt đầu `/`: phù hợp cả domain root và `/<repository>/`. Upload **nội dung bên trong `dist/`** vào Pages artifact hoặc nhánh Pages của repository website khi được phép. Có `.nojekyll`. Không upload toàn bộ workspace vì docs/extracted và proposal là tài liệu nội bộ. Không cần backend, rewrite rule hoặc cấu hình base riêng. Open Graph image dùng relative URL cho bản local; sau khi chọn domain công khai, nên thêm absolute `og:url`/`og:image` tương ứng.

## Giới hạn

Chưa có ảnh GDS/floorplan/routing của toàn core trong nguồn cung cấp; gallery hiển thị ba asset thật và nêu rõ phần thiếu. Full GEMM_top physical signoff chưa có output chứng minh trong snapshot. Không có language toggle giả. Chi tiết kiểm thử thực tế nằm trong `docs/TEST_REPORT.md`.
