# Kiểm kê tính năng ToneGym (nghiên cứu ngày 2026-11-26)

Tài liệu này ghi lại **chức năng** của tonegym.co để làm đặc tả cho app luyện tai tự viết trong repo này. App **không** dùng lại mã nguồn, âm thanh, hình ảnh, tên game, logo, nội dung bài học hay giao diện của ToneGym. Mọi thông tin bên dưới là mô tả lại bằng lời của chúng tôi, kèm nguồn.

Ký hiệu độ tin cậy:
- **[C]** xác nhận từ trang chính thức hoặc báo chí.
- **[U]** người dùng kể trên diễn đàn ToneGym Cafe (khá tin cậy, không chính thức).
- **[I]** suy luận.

Đường dẫn tương đối tính từ `https://www.tonegym.co`.

---

## 1. Tổng quan sản phẩm

ToneGym là nền tảng luyện tai cho nhạc sĩ, gồm:
- 18 game có level [C] (`/games/index`, `/site/pro`).
- Workout hằng ngày [C].
- Bài tập tự do (Exercises) [C] (`/exercise/index`).
- 2 "Playground": Đọc nốt và Giai điệu [C].
- 10 công cụ nhạc lý tương tác [C] (`/tool/index`).
- Khóa Music Theory 101 và "Free School" [C].
- Cộng đồng Spaces và thi đấu hằng tuần ("Olympics") [C].
- Gói Pro trả phí và gói cho trường học [C].
- App iOS và Android đồng bộ với web [C].

---

## 2. 18 game

### 2.1 Luật chung

- **Level [C]:** không nhảy level được (help: `can-i-skip-levels-in-tonegym-games`).
- **Đổi level [C]:** qua level 10 thì có nút "Change level", lùi tối đa 10 level để ôn, rồi quay lại level cao nhất bất cứ lúc nào (help: `can-i-reset-my-current-level-in-the-gym-games`).
- **Chặng:** Melody Hunter có 200 level, mỗi level 8 chặng [C] (rekkerd.org). Suy ra các game khác cũng chia level thành chặng [I].
- **Mạng và lượt an toàn [U]:** người chơi nhắc tới "lives" và "safeties" là hai thứ riêng. Ước khoảng 3 mạng mỗi level [I].
- **Phao cứu sinh (life-ring) [C]:** gợi ý tùy chọn. Route VI phát nốt bass; Interval Barks phát quãng mẫu. Phím tắt H [U].
- **Chế độ so sánh [C]:** sau khi trả lời, bấm C hoặc biểu tượng cái cân để tạm dừng, nghe đáp án sai và đáp án đúng. Có thể bấm bất kỳ phương án nào để nghe, bấm C lần nữa để tiếp tục [U].
- **Phím tắt [C]:** mỗi game có bộ phím tắt, xem ở biểu tượng bàn phím trên trang giới thiệu game; Tab hiện danh sách [U].
- **"Sao đỏ" [U]:** khoảng level 150 là hết level thiết kế tay; sau đó câu hỏi được trộn ngẫu nhiên từ các level cũ. Người chơi kể đã lên tới level 257–781.
- **Điểm [U]:** mỗi level cho nhiều điểm hơn hẳn level trước. Mỗi game hiện phần trăm xếp hạng.
- **Nhạc cụ:** có 16 nhạc cụ [C]. Mặc định là piano; có thể ngẫu nhiên theo game [U]. Nhạc cụ thêm mua bằng xu [C].

### 2.2 Từng game

| Game | Cách chơi | Tiến trình level | Ghi chú |
|---|---|---|---|
| Chordinator | Hiện **tên** hợp âm; nghe 2–4 phương án âm thanh, chọn cái khớp [C] | Bắt đầu với trưởng/thứ/giảm, thêm loại khi lên level [C] | Game mới nhất |
| Chordelius | Nhiều nốt vang cùng lúc; chọn tên hợp âm [C] | dim/aug/dom7 trước lv10; add9 ~lv20–25; sus2 và sus4 ~lv41; mM7, dim7, aug7 ~lv66, rồi half-dim7; maj7sus4, 7♭5, augMaj7 ~lv73 [U] | |
| Intervalis | Hai nốt vang cùng lúc; chọn quãng [C] | Có quãng kép (như m13) ngay từ sớm [U] | |
| Departurer | Hai nốt đi lên; chọn quãng [C] | Người chơi lên tới lv100–200 [U] | |
| Lander | Hai nốt đi xuống; chọn quãng [C] | | |
| Calibrator | Nghe 3 quãng; chọn quãng lớn nhất [C] | | |
| Inversionist | Nghe hợp âm; chọn thế đảo [C] | Thế hẹp trước, thế rộng sau; lv120 có hợp âm 5 nốt m7(9) với 5 thế đảo [U] | |
| Scale Spy | Nghe chuỗi nốt; chọn âm giai, có đồng hồ [C] | Âm giai khó mở dần [C] | Danh sách ~17 âm giai |
| Route VI | Nghe vòng hợp âm; chọn ký hiệu La Mã; phao phát nốt bass [C] | Bắt đầu V6–I và IV6/4–I; chủ âm hoặc hợp âm rải được phát trước [U] | Bấm vào vòng để nghe lại [U] |
| Melody Hunter | Nghe giai điệu 1–4 ô nhịp, dựng lại bằng các nốt cho sẵn trên bàn phím [C] | 200 level × 8 chặng [C]; giai điệu dựa trên nốt 1-3-5 [U] | Lúc ra mắt (2023) chỉ cho Pro [C] |
| Melodix | Nghe giai điệu; chọn đúng các cao độ để dựng lại [C] | Khó dần về độ dài cần nhớ (~lv27–34) [U] | |
| Melody Jay | Nghe giai điệu; hát lại vào micro [C] | Lên tới 8+ nốt [U] | Đếm vào 1-2-3-4 [U] |
| Solfègiator | Nhìn bản nhạc; hát vào micro [C] | Chấm cao độ khắt khe [U] | Sai 3 lần thì cho qua [U] |
| Interval Barks | Phát 1 nốt + hiện tên quãng; hát nốt thứ hai; phao phát quãng mẫu [C] | Lv1 là đồng âm [U] | Chỉnh tầm giọng ở `/account/pitch` [C] |
| Rhythmic Parrot | Nghe tiết tấu; gõ lại bằng chạm hoặc Space, có đồng hồ [C] | Móc kép nghịch phách ~lv90 [U] | Không đổi tempo; có hiệu chỉnh độ trễ gõ [U] |
| Rhythmania | Nhìn ký hiệu tiết tấu; gõ theo [C] | Sau có 6/8, 7/8; tempo tới 170 [U] | Metronome đếm vào [C] |
| Notationist | Đọc ký âm khóa Sol, có giới hạn giờ [C] | Nốt → quãng → hợp âm → thế đảo, rồi lặp lại [U] | Chỉ khóa Sol [U] |
| Bassonist | Đọc khóa Fa [C] | Giống Notationist [I] | |

**Chưa tìm được:**
- Số mạng, số lượt an toàn, số phao chính xác.
- Điểm cần để qua level.
- Bảng nội dung từng level.
- Thời gian đồng hồ.
- 3 game mà tài khoản Free được chơi.

---

## 3. Bài tập tự do (Exercises)

Trang công khai, không thấy khóa Pro [C].

**Cài đặt chung [C]:**
- Nốt gốc: tự nhiên, thăng hoặc giáng.
- Tốc độ: Chậm / Vừa / Nhanh.
- Âm lượng.
- Bộ đếm chuỗi đúng (streak) cho từng chế độ, gợi ý mục tiêu 10.
- Không giới hạn số câu.

**Nhập đáp án ở chế độ "Chơi" [C]:** piano trên màn hình với 3 chế độ chuột, hoặc bàn phím MIDI ("find devices"):
- Đơn: giữ chuột lâu để kéo dài nốt.
- Hợp âm: Ctrl/Cmd + click nhiều phím, Esc để hủy.
- Kéo: giữ Alt và quét qua các phím.

**Từng bài [C]:**

| Bài | Chế độ | Nội dung |
|---|---|---|
| Quãng (`/exercise/intervals`) | Nghe, So sánh (chọn quãng lớn nhất), Chơi, Đọc | 24 quãng P1–M14, chọn ít nhất 3; nút "Oct #1", "Oct #2"; lên / xuống / cùng lúc / trộn |
| Hợp âm (`/exercise/chords`) | Nghe, Chơi, Đọc | ~60–80 loại, lọc theo 3/4/5/6 nốt; lên / xuống / cùng lúc / trộn |
| Âm giai (`/exercise/scales`) | Nghe, Chơi, Đọc | 17 âm giai (xem mục 8); bộ chọn sẵn "Primary" và "Secondary"; lên / xuống / trộn |
| Vòng hợp âm (`/exercise/progressions`) | Nghe, Đọc | Trưởng hoặc thứ; dài 3–6 hợp âm |
| Cao độ (`/exercise/pitch`) | So sánh (chọn nốt cao hơn), Đọc | 17 cách viết nốt; Dễ / Vừa / Khó |
| Tiết tấu (`/exercise/rhythm`) | Đọc 2 ô nhịp rồi gõ lại sau phần đếm vào | 4/4, 3/4, 5/4. Dễ: đen, móc đơn. Vừa: thêm lặng, nối, nghịch phách. Khó: thêm chấm dôi, móc kép. Chấm xanh = đúng nhịp, đỏ = sớm/trễ |

---

## 4. Workout, điểm số, phần thưởng

### Workout hằng ngày [C]
- Bài mới lúc 4h sáng theo múi giờ tài khoản.
- Mất khoảng 10–15 phút.
- Free: 3 game, ngày nào cũng giống nhau. Pro: 5 game xoay vòng khắp thư viện.
- Độ khó tự thích nghi theo kết quả.
- Có chuỗi ngày (streak), đồng bộ giữa app và web.
- Pro tự chỉnh được game trong workout ("Training preferences").

### TPI (ToneGym Performance Index) [C]
- Tính từ điểm tất cả game; cho biết điểm mạnh/yếu theo kỹ năng.
- Không công bố công thức.

### Huy chương và giải thưởng [C]
- Huy chương TPI: Sắt, Đồng, Bạc, Vàng, Kim cương. Chỉ được trao khi hoàn thành workout trong ngày.
- Giải khác:
  - 50 workout.
  - Hoàn thiện phòng nhạc ảo, mở hiệu ứng "Musical Aura" trên hồ sơ.
  - Mời 3 người.
  - Chứng chỉ in được (khoảng 15.000 điểm học tập theo một bài review [U]).
  - Giải chương trình học.
  - Quyên góp xu.

### ToneCoins [C]
- **Nhận:** mỗi workout (Pro 30, Free 10); khi nhận giải, học chương trình, mời bạn, thi đấu.
- **Tiêu:**
  - 15 nhạc cụ ảo, giá 10–1.000 xu (`/products/index`).
  - Quyên góp.
  - Phí thi đấu.

### Thi đấu hằng tuần ("Olympics") [C] (`/contest/index`)
- Theo chủ đề kỹ năng, kéo khoảng 4 ngày.
- Mỗi lượt 4 xu: 1 xu phí, 3 xu vào jackpot.
- Mỗi lượt 60 giây, trả lời đúng càng nhiều càng tốt.
- Top 3 nhận huy chương vàng/bạc/đồng.
- Top 20 chia jackpot: 20% / 15% / 11% / 7%×2 / 4%×5 / 2%×10.

### Thống kê trên hồ sơ [C]
Hạng TPI, tổng xu, số workout, số game, điểm học tập, người theo dõi.

---

## 5. Free và Pro

| Tính năng | Free | Pro | Nguồn |
|---|---|---|---|
| Game | Chỉ 3 game cố định trong workout | Cả 18 game, không giới hạn | `/site/pro`, help `what-is-an-audio-workout` |
| Workout | 3 game, giống nhau mỗi ngày | 5 game, xoay vòng | như trên |
| Xu mỗi workout | 10 | 30 | help `how-can-i-earn-tonecoins` |
| Tự chọn game cho workout | Không | Có | `/site/pro` |
| So TPI và phần trăm với thành viên khác | Không | Có | help `can-i-see-how-i-compare-to-other-members` |
| Điểm mạnh/yếu, mốc tiến bộ, thống kê nâng cao | Cơ bản | Đầy đủ | `/site/pro` |
| "Tất cả công cụ", kế hoạch luyện cá nhân | Hạn chế (không thấy khóa cụ thể) | Có | FAQ trang chủ |
| Bài tập, Spaces, thi đấu, School, Playground | Có | Có | [I] / báo chí |

### Giá (USD) [C]
- Tháng: $13.95.
- Năm: $74.95 (web), $74.99 (iOS).
- Trọn đời: $255, chỉ bán trên web, thanh toán PayPal.

### Điều khoản [C]
- Không có dùng thử.
- Hoàn tiền 30 ngày cho gói năm và trọn đời mua trên web.
- Nâng gói được, hạ gói không được, không tạm dừng được.
- Giảm 30% cho học sinh và giáo viên.
- Gói trường học: $99.95/học sinh/năm, kèm bảng quản trị, lớp học, giao bài, theo dõi học sinh.

---

## 6. Playground

- **Đọc nốt [C]** (`/playground/sightreading`):
  - Gồm phần luyện, game (Notationist, Bassonist) và thi hằng tuần.
  - Khóa Sol, Đô, Fa.
  - Luyện nốt, quãng, hợp âm, thế đảo; nhiều mức khó; lưu thống kê.
- **Giai điệu [C]** (`/playground/melody`):
  - Gồm phần luyện chép giai điệu, game và thi hằng tuần.
  - Chọn điệu thức diatonic, số bè, 4 mức khó.
  - Luyện nốt đơn, quãng, hợp âm.

---

## 7. Công cụ (`/tool/item?id=…`) [C]

Mọi trang công cụ có:
- Bảng piano với 3 chế độ chuột và kết nối MIDI.
- Bộ chọn tiếng (8 tiếng piano/keyboard, thêm nhạc cụ bằng xu).

| # | Công cụ | Chức năng chính |
|---|---|---|
| 1 | Tạo vòng hợp âm (`progression-generator`) | 21 chủ âm; 60–140 bpm (bước 10); phát cùng lúc / rải lên / rải xuống; voice-leading; 31 vòng mẫu có tên (4 hoặc 8 hợp âm); danh sách vòng của bạn; ô nhập mô tả bằng chữ |
| 2 | Vòng quãng năm (`circle-of-fifths`) | 12 chủ âm kèm nốt đồng âm; 7 điệu thức; bố cục Âm giai (số La Mã) hoặc Quãng; click phát hợp âm 3 nốt, Alt+click phát hợp âm 7, Ctrl+click đặt làm chủ âm; hiện hóa biểu |
| 3 | Tra âm giai (`scale-analyser`) | Chọn chủ âm; 40–120 bpm; lên/xuống; điệu thức diatonic (kể cả các điệu thức của thứ hòa âm và thứ giai điệu) và âm giai khác; bảng hợp âm theo bậc (3, 7, 9, 11, 13); tìm âm giai từ các nốt đã chọn; sao chép link |
| 4 | Ghi nhớ quãng (`interval-memorizer`) | m2–P8; 21 nốt gốc; lên / xuống / cùng lúc; xem trên phím đàn hoặc cần đàn; gắn bài hát tham chiếu |
| 5 | Luyện xướng âm (`sight-singing-trainer`) | Loại giọng Bass → Soprano; 27 bài ở 4 cấp, mỗi bài có bpm và độ dài; phát nốt đầu rồi hát |
| 6 | Khởi động giọng (`vocal-warmup`) | 18 bài mẫu ở 3 cấp; tự tạo bài (tempo, nguyên âm, số lần lặp, cách phát âm); ghép thành danh sách phát |
| 7 | Chơi hợp âm (`chord-analyser`) | 21 nốt gốc; cùng lúc / lên / xuống; 61 loại hợp âm (3–6 nốt); chọn thế đảo; phân tích nốt gốc, nốt trong, nốt màu, bass |
| 8 | Đo tầm giọng (`vocal-range-test-tool`) | Hát nốt cao 3 giây, nốt thấp 3 giây; piano B1–D6 kèm số Hz; kết quả: tầm giọng, loại giọng, số nửa cung, so với ca sĩ nổi tiếng |
| 9 | Kiểm tra cao độ tuyệt đối (`perfect-pitch-test`) | Phần nghe: 6 nốt, trả lời bằng nút C–B. Phần hát: hát nốt yêu cầu, chấm độ chính xác |
| 10 | Piano ghi âm (`piano-recorder`) | Chơi bằng chuột hoặc MIDI; lưu và chia sẻ bản ghi |
| + | Máy lên dây (guitargym.co) | Dùng micro; đồng hồ "chùng / căng" |

---

## 8. Danh mục nội dung nhạc lý thấy trên các bài tập

- **Quãng:** P1, m2, M2, m3, M3, P4, tritone, P5, m6, M6, m7, M7, P8, m9, M9, m10, M10, P11, quãng 11 tăng, P12, m13, M13, m14, M14 (24 quãng).
- **Âm giai (17):**
  - Trưởng (Ionian), thứ tự nhiên (Aeolian), thứ hòa âm, thứ giai điệu (jazz).
  - Dorian, Phrygian, Lydian, Mixolydian, Locrian.
  - Ngũ cung trưởng, ngũ cung thứ, Blues.
  - Toàn cung, cung chromatic.
  - Bebop trưởng, Bebop thứ (Dorian), Bebop át.
- **Hợp âm:** từ hợp âm 3 nốt đến 6 nốt, ví dụ:
  - maj, min, dim, aug, sus2, sus4.
  - 6, m6, 7, maj7, m7, mMaj7, dim7, m7♭5, aug7, augMaj7, 7sus4.
  - add9, 9, maj9, m9, 7♭9, 7♯9, 11, 13, 7(♯9,♭13), …

---

## 9. Học tập

- **Music Theory 101** (`/course/index`) [C]:
  - Miễn phí; 7 chương, 46 bài: Nốt (4), Âm giai (7), Quãng (11), Hợp âm (11), Vòng hợp âm (4), Tiết tấu (7), Ký âm (2).
  - Chủ yếu là chữ. Có ví dụ nghe, bài kiểm tra "Load test", link sang game liên quan.
- **Free School** (`/site/school`) [C]:
  - Các chương trình là video tuyển chọn (khả năng cao là YouTube [I]).
  - Điểm học tập tính theo thời gian xem.
  - Hoàn thành khi: xem 80% video, qua bài kiểm tra, có giải luyện tai.

---

## 10. Cộng đồng [C]

- **Spaces:** đăng bài có ảnh/GIF/link; trả lời; "props"; người quản lý; báo cáo bài viết.
- **Người theo dõi.**
- **Nhắn tin:** chỉnh được ai được nhắn, có chặn.
- **Hồ sơ:** công khai mặc định, ẩn được; trạng thái online; "phòng nhạc" hiển thị nhạc cụ.

---

## 11. Ứng dụng di động [C]

- iOS "ToneGym Ear Training Studio" (id6748112656) và Android (`com.hk.tonegym`).
- Dùng chung tài khoản, đồng bộ tiến độ, streak và TPI.
- Có hướng dẫn thêm web vào màn hình chính.

---

## 12. Cách app này xử lý từng nhóm tính năng

| Nhóm ToneGym | Trong app này |
|---|---|
| 18 game | Làm lại cơ chế, tên riêng, bảng level tự soạn |
| Exercises, Playground | Làm lại đầy đủ |
| Workout, TPI, huy chương, xu | Làm lại, tính trên máy ("Ear Index") |
| Pro | Không có. Mọi thứ mở sẵn |
| 10 công cụ + tuner | Làm lại |
| Music Theory 101 | Tự viết nội dung mới (vi/en) |
| Free School | Không làm (là video bên thứ ba) |
| Spaces, nhắn tin, người theo dõi | Bỏ. Thay bằng nhiều hồ sơ trên máy và bảng xếp hạng giữa các hồ sơ |
| Thi đấu hằng tuần | Đấu với kỷ lục của chính mình / các hồ sơ, xu ảo |
| Thanh toán, gói trường học | Bỏ |

---

## Nguồn

**tonegym.co:**
- Trang: `/`, `/site/pro`, `/games/index`, `/games/view?id=…`, `/exercise/*`, `/playground/*`, `/tool/*`, `/course/index`, `/site/school`, `/site/education`, `/contest/index`, `/products/index`, `/space/index`.
- Help center (`/help/item?id=…`): `what-is-an-audio-workout`, `when-do-i-get-a-new-workout`, `how-can-i-earn-tonecoins`, `how-is-spi-calculated`, `how-can-i-earn-badges`, `can-i-skip-levels-in-tonegym-games`, `can-i-reset-my-current-level-in-the-gym-games`, `can-i-see-how-i-compare-to-other-members`, `what-are-the-keyboard-shortcuts-for-the-games`, `how-to-adjust-the-vocal-range-pitch-for-interval-barks`, `how-are-learning-points-calculated`.
- Diễn đàn ToneGym Cafe (`/space/talk?id=NASZ2448MAR`).

**Nguồn ngoài:**
- [App Store](https://apps.apple.com/app/id6748112656)
- [rekkerd.org — Melody Hunter](https://rekkerd.org/improve-your-musical-skills-with-melody-hunter/)
- [gearnews — chord progression generator](https://www.gearnews.com/tonegym-chord-progression-generator-a-free-online-chord-and-learning-tool)
- [MusicRadar](https://musicradar.com/news/tonegym-is-an-online-ear-training-platform-that-could-help-you-to-master-music-theory-and-write-better-songs)
- [jadebultitude.com](https://jadebultitude.com/ear-training/tonegym/)
- [monosounds.studio](https://monosounds.studio/soundgym-vs-tonegym/)
