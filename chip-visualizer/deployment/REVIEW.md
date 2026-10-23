# Chuẩn bị triển khai hai website — chờ người dùng duyệt

Kiểm tra ngày 23/10/2026. Chưa stage, commit, push, thay đổi Settings trên GitHub hoặc deploy.

## Trạng thái đã kiểm tra

- Repository đích: https://github.com/nguyen-ky2910/WEB_GEMM_ASIC_SKY130
- Nhánh mặc định `main`, HEAD `9480eff2aa8ee3ad64b2c5d49570caa123741eef`. Đã đối chiếu lại bằng `git ls-remote` sau khi chuẩn bị.
- Checkout local được dùng tiếp tại `chip-visualizer/.tooling/deployment/repository`; không clone lại hoặc tạo lại website.
- Git status cuối bước chuẩn bị dự kiến chỉ có `M .github/workflows/deploy.yml` và `?? chip-visualizer/`; index chưa có file được stage.
- Repository đang có website riêng ở root và một workflow Pages `.github/workflows/deploy.yml`. Build cũ chỉ dùng Node built-in, chạy `npm run build`, xuất `dist/`.
- URL website cũ https://nguyen-ky2910.github.io/WEB_GEMM_ASIC_SKY130/ trả HTTP 200; HTML khớp bản source đã kiểm tra sau khi chuẩn hóa LF/CRLF.
- API Pages settings không đọc được bằng kết nối hiện tại; chưa xác minh được cấu hình environment/approval của tài khoản chủ repository. Không thay đổi các thiết lập này.

## Cấu trúc repository sau khi được duyệt

```text
WEB_GEMM_ASIC_SKY130/
├── .github/workflows/deploy.yml    # file có sẵn duy nhất cần sửa
├── index.html                     # website cũ, giữ nguyên
├── src/                           # website cũ, giữ nguyên
├── public/                        # website cũ, giữ nguyên
├── docs/                          # website cũ, giữ nguyên
├── scripts/                       # website cũ, giữ nguyên
├── package.json                   # website cũ, giữ nguyên
└── chip-visualizer/                # toàn bộ source website mới
    ├── src/, public/, demo-data/
    ├── scripts/extraction/, scripts/validation/, scripts/deployment/
    ├── tests/, docs/screenshots/, deployment/
    ├── package.json, pnpm-lock.yaml, pnpm-workspace.yaml
    ├── vite.config.ts, playwright.config.ts, tsconfig.json
    └── các hướng dẫn và manifest
```

Toàn bộ 77 file tracked cũ ngoài workflow được giữ nguyên byte trong checkout. Không thêm mã mới vào `src/`, `public/`, `docs/`, `scripts/` hoặc `package.json` ở root.

Danh sách đầy đủ source website sẽ thêm: [FILE_MANIFEST.md](../FILE_MANIFEST.md). Bản diff workflow nằm tại `.tooling/deployment/workflow.diff` trong workspace gốc. Không thêm `node_modules/`, `dist/`, `.tooling/`, cache hoặc báo cáo kiểm thử vào Git.

## Thay đổi phục vụ deployment trong website hiện có

| File bên trong chip-visualizer/ | Thay đổi |
| --- | --- |
| `vite.config.ts` | Base production `/WEB_GEMM_ASIC_SKY130/gemm32/`; dev `/`; cho phép override có chủ đích bằng `VITE_BASE_PATH`. |
| `src/app/navigation.ts`, `src/app/App.tsx` | Thêm hash navigation cho 15 trang, giữ trạng thái các view đã ghé, hỗ trợ Back/Forward và mở trực tiếp/refresh. |
| `package.json` | Khai báo pnpm 11.25.0; không thay đổi dependency để deploy. |
| `playwright.config.ts` | Chrome local; Chromium đã cài bởi Playwright trong CI; URL test nhận qua biến môi trường. |
| `eslint.config.js` | Khai báo Node globals cho script deployment `.mjs`. |
| `scripts/validation/test_extractors.py` | Parser chạy được từ standalone checkout; kiểm tra nội dung 58 bản evidence, chấp nhận khác LF/CRLF; kiểm tra 418 bản gốc vẫn giữ nguyên byte trong workspace nghiên cứu. |
| `tests/navigation.test.ts` | Kiểm tra phân giải hash cho đủ 15 trang và trang mặc định. |
| `tests/browser/deployment.spec.ts` | Kiểm tra toàn bộ file production qua HTTP/hash, direct link + refresh 15 trang, Back/Forward và website cũ. |
| `scripts/deployment/prepare_repository.py` | Copy có kiểm soát vào checkout đã kiểm tra; bảo toàn source cũ, loại dependency/build/cache/artifact lớn; không stage/commit/push. |
| `scripts/deployment/compose-pages.mjs` | Ghép hai output, kiểm tra hash từng file cũ và rà soát artifact xuất bản. |
| `deployment/github-pages.yml` | Mẫu thay thế workflow hiện tại; build/test cả hai website trước khi deploy cùng một artifact. |
| `README.md`, `public/docs/README.md`, `FILE_MANIFEST.md`, tài liệu này | Cập nhật cách chạy và phương án triển khai hai website. |

Các thành phần 3D, dữ liệu, GEMM, AXI, CSS, layout và bản dịch đã có được giữ lại. Không sửa bản RTL/OpenLane/báo cáo gốc. Không chạy lại ASIC flow.

## Phương án Pages

1. Cài dependency mới bằng lockfile riêng trong `chip-visualizer/`; chạy typecheck, lint, unit/parser/i18n checks.
2. Chạy lệnh build cũ ở root như trước; build Vite riêng trong `chip-visualizer/`.
3. Ghép output theo cấu trúc:

```text
dist/
├── index.html, src/, images/, fonts/, models/, evidence/, .nojekyll
└── gemm32/
    ├── index.html
    ├── assets/
    ├── generated-data/
    ├── evidence/
    └── docs/
```

4. So sánh SHA-256 của 18 file output cũ trước/sau ghép; chặn nếu thay đổi. Chặn raw ASIC binary/PDK format, credential pattern, symlink, file trên 5 MiB trong artifact.
5. Chạy Playwright trên máy chủ static thuần, có đầy đủ prefix `/WEB_GEMM_ASIC_SKY130/`; không dựa vào SPA fallback của Vite.
6. Upload một artifact chứa cả hai website. Pull request chỉ build/test; push vào `main` hoặc manual run trên `main` mới chạy job deploy sau khi build thành công. Không tạo workflow Pages thứ hai có thể thay thế website cũ.

Các action được pin SHA và đã kiểm tra commit tồn tại trong repository chính thức của GitHub Actions. Workflow theo [hướng dẫn Vite](https://vite.dev/guide/static-deploy) và [GitHub Pages custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages). Job deploy dùng `pages: write`, `id-token: write` và environment `github-pages` như workflow cũ.

## Kết quả kiểm thử local

| Kiểm tra | Kết quả |
| --- | --- |
| Cài dependency ở checkout độc lập | `pnpm install --frozen-lockfile` thành công; không cần cây nghiên cứu |
| TypeScript / ESLint | PASS |
| Vitest | 22/22 PASS |
| Python trong workspace nghiên cứu | 6/6 PASS; SHA-256 của 418 file gốc không đổi |
| Python ở checkout web độc lập | 5 PASS, 1 SKIP có chủ đích vì không chứa cây RTL gốc |
| EN/VI | 324 khóa đầy đủ; chuyển ngôn ngữ được kiểm tra trên trình duyệt |
| Build website cũ | PASS kiểm tra JS syntax, 63 unique IDs, anchors, assets/evidence |
| Build React/Vite production | PASS |
| Production browser suite | 9/9 PASS, 33.3 giây, Chrome headless với software WebGL |
| File/asset production qua HTTP | 114/114 HTTP 200 và hash nội dung khớp file build |
| Hash output website cũ | 18/18 không đổi sau khi ghép |
| Artifact ghép | 114 file, 7,346,771 byte; không chứa PDK/raw ASIC binary, credential pattern hoặc file vượt giới hạn |

Suite trình duyệt đã kiểm tra WebGL canvas có drawing buffer, chọn macro bằng tọa độ 3D, camera/auto-rotate, animation Play/Pause/Stop, EN/VI, GEMM/reference/errata, AXI backpressure/ID register, import dữ liệu, các trang phân tích, responsive 1600/1366/390 px, toàn bộ 15 hash route sau reload, Back/Forward, homepage/navigation/dataflow của website cũ. Ảnh kiểm thử và HTML report nằm trong checkout `chip-visualizer/test-results/` và `chip-visualizer/playwright-report/`, đều bị Git ignore.

Đây là kết quả local trên Windows. Workflow chưa chạy trên GitHub vì chưa được phép push; lần chạy CI trên Ubuntu và kiểm tra URL công khai là bước sau khi được duyệt. Các mô phỏng giữ nguyên phạm vi minh họa/toán học đã công bố trong LIMITATIONS, không phải kiểm chứng RTL mới.

## Xem trước ngay trên máy này

- Website cũ: http://127.0.0.1:4180/WEB_GEMM_ASIC_SKY130/
- Website mới: http://127.0.0.1:4180/WEB_GEMM_ASIC_SKY130/gemm32/
- Ví dụ direct link: http://127.0.0.1:4180/WEB_GEMM_ASIC_SKY130/gemm32/#/axi

Server preview chạy trên loopback, chỉ truy cập được từ máy này. Website mới vẫn chưa có bản public được xác minh.

URL dự kiến sau khi triển khai thành công:

- Cũ: https://nguyen-ky2910.github.io/WEB_GEMM_ASIC_SKY130/
- Mới: https://nguyen-ky2910.github.io/WEB_GEMM_ASIC_SKY130/gemm32/

## Quyền GitHub và bước cần duyệt

Kết nối GitHub trong ứng dụng hiện đăng nhập `HoangNhan2412-ICD`, có `pull: true`, `push: false`, `admin: false` ở repository đích. Git Credential Manager trên Windows đã liệt kê tài khoản `nguyen-ky2910`; chưa thử ghi nên chưa khẳng định credential này còn hiệu lực/quyền workflow.

Sau khi duyệt, có thể dùng tài khoản chủ repository đã có trong Credential Manager. Nếu cần kết nối lại, dùng giao diện đăng nhập GitHub để kết nối tài khoản `nguyen-ky2910` hoặc cộng tác viên có quyền Write, đồng thời cấp quyền cho repository này. Người có quyền quản trị cần xác nhận Settings → Pages → Source = GitHub Actions và cho phép workflow/environment `github-pages`. Không gửi token/password trong chat.

Phạm vi xin duyệt: thêm toàn bộ `chip-visualizer/`, thay một workflow đã chỉ rõ, commit/push các thay đổi được duyệt và cho phép workflow triển khai cả hai website. Trước push phải kiểm tra lại `origin/main`; nếu có thay đổi mới thì đối chiếu và tích hợp trước, không force-push. Khi CI/deploy thành công sẽ kiểm tra lại cả hai URL công khai, model/assets và direct link rồi mới cung cấp URL mới dưới trạng thái đã xác minh.

Nếu triển khai cần khôi phục, dùng lịch sử Git để revert commit triển khai và workflow trước đó; không xóa source website cũ. Bản đã publish hiện tại không bị thay thế khi build/test chuẩn bị thất bại.
