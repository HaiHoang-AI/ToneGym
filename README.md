# EarLab — phòng luyện tai chạy local

Web app luyện tai (ear training) chạy hoàn toàn trên máy bạn:
- Quãng, hợp âm, âm giai, vòng hợp âm.
- Tiết tấu, giai điệu, đọc nốt, hát.

Không cần tài khoản, không cần server. Dữ liệu nằm trong trình duyệt và mọi tính năng đều mở sẵn.

Chức năng được thiết kế tương đương nền tảng ToneGym. Bản kiểm kê tính năng nằm ở [docs/tonegym-feature-inventory.md](docs/tonegym-feature-inventory.md). Đây là app **tự viết lại**: không dùng mã nguồn, âm thanh, hình ảnh, tên game hay nội dung của ToneGym.

## Chạy app

Cần Node.js 20 trở lên.

```bash
npm install
npm run setup   # tải mẫu piano (~2 MB) vào public/samples/, chỉ cần một lần
npm run dev     # mở http://localhost:5173
```

Nếu chưa chạy `npm run setup`, app vẫn chạy nhưng dùng tiếng synth thay cho piano.

### Lệnh khác

| Lệnh | Việc |
|---|---|
| `npm test` | Chạy unit test (Vitest) |
| `npm run e2e:install` | Cài Chromium cho test giao diện vào `D:\ms-playwright` (một lần) |
| `npm run e2e` | Chạy test giao diện (Playwright) |
| `npm run typecheck` | Kiểm tra kiểu TypeScript |
| `npm run build` | Build bản production vào `dist/` |
| `npm run preview` | Chạy thử bản build |

## Tiến độ

| Giai đoạn | Nội dung | Trạng thái |
|---|---|---|
| 1 | Nền móng: module nhạc lý, bộ máy âm thanh, piano trên màn hình, hồ sơ, cài đặt, song ngữ Việt/Anh | ✅ |
| 2 | 9 game nghe (quãng, hợp âm, thế đảo, âm giai, vòng hợp âm), bài tập tự do, workout hằng ngày, Ear Index, hạng, xu, thống kê, giao diện sáng/tối, Yumika và thầy nhạc | ✅ |
| 3 | Tiết tấu và giai điệu: 4 game, bài tập tiết tấu, đo độ trễ gõ nhịp, Playground chép giai điệu | ✅ |
| 4 | Đọc nốt: 2 game khóa Sol/Fa, chế độ Đọc trong bài tập, Playground đọc nốt (khóa Sol/Đô/Fa) | ✅ |
| 5 | 3 game hát (micro), trang Công cụ: máy lên dây, đo tầm giọng, cao độ tuyệt đối, luyện xướng âm, khởi động giọng | ✅ |
| 6 | Công cụ nhạc lý còn lại và bàn phím MIDI | ⏳ |
| 7 | Khóa nhạc lý, thi tuần, giải thưởng, cửa hàng nhạc cụ, chạy offline (PWA), sao lưu | ⏳ |

## Cấu trúc mã

```
src/
  theory/      quãng, hợp âm (46 loại), âm giai (17), số La Mã → hợp âm có voice-leading, RNG có seed
  audio/       bộ máy âm thanh (Tone.js): piano mẫu hoặc synth dự phòng, phát chuỗi, dừng
  components/  PianoKeyboard (click, Ctrl+click để bấm hợp âm, Alt để quét phím, bàn phím máy tính)
  db/          IndexedDB (Dexie): hồ sơ và cài đặt
  i18n/        tiếng Việt và tiếng Anh
  app/, pages/ layout, trang chủ, kiểm tra âm thanh, hồ sơ
scripts/fetch-samples.mjs   tải mẫu âm
docs/                       bản kiểm kê tính năng
```

## Ghi công

Piano: Salamander Grand Piano của Alexander Holm, giấy phép CC BY 3.0, bản MP3 do dự án Tone.js lưu trữ. Xem [public/samples/ATTRIBUTION.md](public/samples/ATTRIBUTION.md).

Thư viện: React, Vite, Tone.js, tonal, Dexie, i18next, Tailwind CSS.
