---
name: fastdo-eval-runner
description: Chạy test QA tự động cho testcase trong Google Sheet "fEvaluation" của Fastdo — điều khiển Chrome thật qua CDP, quay video (có con trỏ ảo), upload Catbox lấy link vĩnh viễn, ghi kết quả vào Sheet. Tự kích hoạt khi user gõ dạng "chạy EVAL_xxx" / "test EVAL_xxx".
---

# Fastdo Eval Runner

Bộ script Puppeteer chạy test QA cho các testcase trong sheet "fEvaluation - VIBE", theo đúng quy trình đã kiểm chứng thật (không phải lý thuyết). Đây là công cụ vận hành/QA thuần — KHÔNG liên quan tới quy trình phát triển phần mềm, không cần ticket ID.

## Khi dùng

Kích hoạt khi user gõ "chạy EVAL_xxx", "test EVAL_xxx", hoặc yêu cầu tương đương chạy 1 testcase cụ thể trong sheet fEvaluation.

## Chuẩn bị môi trường (kiểm tra trước mỗi lần chạy)

1. Chrome đang mở với `--remote-debugging-port=9222` — kiểm tra: `curl -s http://localhost:9222/json/version`. Không kết nối được → DỪNG, báo user mở Chrome debug mode.
2. `node_modules` ở root repo đã cài chưa — nếu chưa: `npm install` (xem README.md).
3. File `.env` ở root repo đã tồn tại chưa (chứa `FASTDO_EMAIL`, `FASTDO_PASSWORD`, `CATBOX_USERHASH`) — nếu chưa, copy từ `.env.example` và điền giá trị thật. `config.js` sẽ báo lỗi rõ ràng nếu thiếu biến nào.
4. `ffmpeg` có trong PATH — kiểm tra `ffmpeg -version`. Thiếu → DỪNG, báo user.

## Cấu hình mặc định (trong `scripts/config.js`, override khi user cung cấp khác trong yêu cầu)

| Key | Giá trị mặc định |
|---|---|
| Chrome debug | `http://localhost:9222` |
| Target URL | `https://lp3svsq4-5112.asse.devtunnels.ms/` — dev tunnel, nếu hết hạn/đổi thì DỪNG và hỏi URL mới |
| Login | đọc từ `.env` (`FASTDO_EMAIL`/`FASTDO_PASSWORD`), tổ chức "Water Quality - NH3T TEAM" |
| Google Sheet | `1ArYMmaaqbb_g1aa9irROzGXAm1tULQvUw8rq-sXK8Hk`, tab "fEvaluation - VIBE", cột ID = A, cột kết quả TEST LẦN 1 = I (xem mục "Xác định vòng test" để tính cột cho lần khác) |
| Catbox userhash | đọc từ `.env` (`CATBOX_USERHASH`) |

Nếu user đưa link Sheet khác → dùng link đó (không hỏi lại), miễn cấu trúc cột giống (ID/Function/Tiêu đề/Mô tả/.../Trạng thái/Kết quả thực hiện).

Đọc/verify nội dung Sheet: dùng MCP `sheet_read` nếu có kết nối (chỉ đọc, ổn định). Ghi Sheet: luôn qua `scripts/sheet_writer.js` (Puppeteer thao tác trực tiếp trên giao diện web) — KHÔNG dùng MCP cho phần ghi/quay video/upload.

## Xác định vòng test (TEST LẦN N) trước khi ghi kết quả

Sheet có nhiều khối cột lặp lại theo từng vòng test: "TEST LẦN 1", "TEST LẦN 2", "TEST LẦN 3"... (mỗi khối gồm Ưu tiên/Môi trường/Trạng thái/Kết quả thực hiện/DEV-QC NOTE, và từ TEST LẦN 3 trở đi có thêm cột "Test Date").

- **Mặc định (user không nhắc gì tới việc test nhiều lần)**: chỉ ghi vào cột "Kết quả thực hiện" của **TEST LẦN 1** (cột I theo cấu hình mặc định) — không hỏi, không tự ý ghi thêm vào các lần khác.
- **User có đề cập tới test nhiều lần / test lại / "lần thứ mấy"** (VD "test lại EVAL_009", "chạy EVAL_010 lần 2", "test thêm vài lần nữa"): PHẢI DỪNG và hỏi rõ muốn ghi vào TEST LẦN mấy trước khi chạy — không tự đoán lần nào.
- **Cách xác định đúng cột "Kết quả thực hiện" cho 1 TEST LẦN N bất kỳ** (không hardcode cột — vị trí có thể lệch giữa các lần vì "Test Date" chỉ xuất hiện từ Lần 3 trở đi):
  1. Đọc dòng 1 (dòng chứa nhãn gộp "TEST LẦN N") của Sheet qua `sheet_read`.
  2. Tìm cột mà ô chứa đúng chữ "TEST LẦN N" (chỉ ô đầu tiên của vùng gộp có giá trị, các ô còn lại trong vùng gộp rỗng).
  3. Cột "Kết quả thực hiện" nằm ở vị trí **+3** tính từ cột đó (thứ tự cố định trong mỗi khối: Ưu tiên(+0), Môi trường(+1), Trạng thái(+2), Kết quả thực hiện(+3), DEV/QC NOTE(+4)).
  4. Dùng cột vừa tính được thay cho cột I mặc định ở toàn bộ bước "Ghi Sheet" phía dưới.

## Quy trình chuẩn cho mỗi testcase

1. **Đọc nội dung testcase** từ Sheet (MCP `sheet_read`, hoặc mở tab Sheet bằng Puppeteer nếu không có MCP) — lấy đúng "Các bước" và kết quả mong đợi ở cột Mô tả (D), xác định số dòng, và xác định đúng TEST LẦN N cần ghi theo rule ở mục trên (mặc định Lần 1 = cột I nếu user không nhắc gì).
2. `node scripts/close_stale_tabs.js` — đóng tab Fastdo cũ.
3. Nếu khu vực UI của case còn lạ (chưa có ví dụ tương tự trong "Bài học kỹ thuật" bên dưới) → dry-run: viết 1 script tạm connect CDP, login, điều hướng, chụp ảnh + liệt kê DOM (`page.$$eval('input, button, a, select', ...)`) để xác định đúng selector — KHÔNG quay video ở bước này, xoá script tạm sau khi dò xong.
4. Copy `scripts/template_record.js` → `scripts/<TESTCASE_ID>_record.js`, sửa `TESTCASE_ID` và viết `runCustomSteps(ctx)` theo đúng bước testcase.
5. Chạy: `node scripts/<TESTCASE_ID>_record.js` — script tự lo login/chọn tổ chức/quay video/upload Catbox, in ra dòng `SUMMARY_JSON: {...}` ở cuối (parse dòng này để lấy `videoUrl`, `pass`, `resultText`).
6. **Verify độc lập** (bắt buộc — xem mục riêng bên dưới) trước khi tin `pass` trong SUMMARY_JSON.
7. Ghi Sheet — dùng `scripts/sheet_writer.js`, KHÔNG gộp draft+commit trong 1 lệnh:
   - Viết 1 script nhỏ gọi `getOrOpenSheetPage` → `gotoCell(page, '<cột Kết quả thực hiện đã xác định ở mục "Xác định vòng test">' + '<dòng>')` (mặc định `I<dòng>` nếu là TEST LẦN 1) → `typeAppendDraft(page, '- Video Test Record: ' + videoUrl, 'draft_check.png')`, dừng lại.
   - Đọc ảnh `draft_check.png` bằng tool Read — xác nhận nội dung đúng, giữ nguyên nội dung cũ (không bị ghi đè).
   - Đúng rồi mới chạy tiếp script gọi `commitCell(page, 'saved.png')`.
   - Đọc lại ô đó qua MCP `sheet_read` để xác nhận đã lưu đúng.
8. Gửi video (`<TESTCASE_ID>_AutoRecord.mp4`) + ảnh `saved.png` cho user (SendUserFile) — làm TRƯỚC bước dọn dẹp.
9. Xoá `scripts/<TESTCASE_ID>_AutoRecord.mp4`, `scripts/<TESTCASE_ID>_record.js`, và mọi `.png` trung gian của case này — không tích tụ theo thời gian.

## Verify độc lập (bắt buộc, không được bỏ qua)

Sau khi script báo `pass: true`, LUÔN reload trang + đọc lại toàn bộ bảng/phần tử liên quan (không chỉ tin `SUMMARY_JSON` hay 1 kết quả XPath match đầu tiên trong `runCustomSteps`):
- Nếu tên/nội dung có thể trùng với record cũ đã tồn tại từ lần test trước → so khớp theo mốc thời gian mới nhất (cột "Cập nhật"/timestamp hiển thị trên UI) để chắc chắn đang đọc đúng record vừa thao tác trong lần chạy NÀY, không phải 1 dòng cũ trùng tên còn sót lại.
- Panel tóm tắt/preview trên UI (kiểu "Tóm tắt (luôn hiện)") CÓ THỂ LÀ BUG HIỂN THỊ, không phản ánh đúng state thật — bằng chứng đúng-sai phải lấy từ: (a) thử submit và xem có bị chặn validate không, hoặc (b) đọc trực tiếp giá trị DOM/API, không phải nhìn panel preview.

## Bài học kỹ thuật (bắt buộc áp dụng)

- **Tab mới cho mỗi lần quay chính thức** — `template_record.js` đã tự làm việc này (`browser.newPage()`), không tự ý đổi sang tái dùng tab cũ. Tái dùng tab qua nhiều lần gọi script gây lỗi `The circuit associated with this dispatcher is no longer available` (Blazor Server circuit chết do idle/nhiều lần điều hướng rời rạc).
- **Ưu tiên điều hướng thẳng URL query** (VD `?tab=scale`, `?tab=criterion`, `?tab=cycle&view=editor&id=...`) thay vì click xuyên UI khi có thể — click chuyển tab đôi khi chỉ đổi active state mà không render nội dung (lỗi/độ trễ phía app, không phải do script). Muốn biết URL đúng cho 1 khu vực mới: dò bằng cách click qua UI 1 lần trong bước dry-run, đọc `page.url()` sau khi nội dung đã load, rồi dùng URL đó cho lần quay chính thức.
- **`clickUntil`** (trong `human_input.js`) khi bắt buộc phải click qua UI (không có URL tương ứng): click → chờ điều kiện xuất hiện (vài giây) → nếu chưa có, click lại, tối đa 3 lần. Đã gặp thật với nút "Sửa" (mở kỳ đánh giá nháp) — lần click đầu chỉ đổi active state, lần 2 mới thực sự chuyển trang.
- **Tái dùng dữ liệu nháp/tiền đề có sẵn** khi Sheet/hệ thống đã có record phù hợp (VD kỳ đánh giá nháp đã điền sẵn Bước 1) thay vì luôn tạo mới — giảm số bước phải tự động hoá. Không bắt buộc (date-time picker giờ tự động hoá được, xem mục dưới) nhưng vẫn là lựa chọn nhanh hơn khi tiện.
- **XPath chọn phần tử**: viết trực tiếp ở cấp `page.$$()`, KHÔNG scope qua `elementHandle.$()` cho XPath lồng nhau — đã gặp lỗi không tìm thấy/không click được khi scope kiểu đó. VD đúng: `page.$$('xpath/.//tr[contains(., "A")][contains(., "B")]//a[contains(., "C")]')`.

### Xử lý Flatpickr date-time picker

Dùng `setFlatpickrField(page, placeholder, day, hour, minute)` trong `scripts/datetime_picker.js` — đã kiểm chứng bằng submit thật thành công. KHÔNG dùng `element._flatpickr.setDate()` (JS API trực tiếp) — không ổn định, Blazor re-render làm hỏng tham chiếu instance. Panel "Tóm tắt (luôn hiện)" không đáng tin để verify việc này — verify bằng cách thử bấm nút tiếp theo (Tiếp tục/Lưu) và xem có bị chặn bởi lỗi validate ngày giờ hay không.

## Ví dụ `runCustomSteps` (dạng xác nhận dialog — tương tự EVAL_007)

```js
async function runCustomSteps(ctx) {
  const { page, humanClick, waitXPath, clickUntil } = ctx;

  await page.goto('https://lp3svsq4-5112.asse.devtunnels.ms/evaluation?tab=scale', {
    waitUntil: 'domcontentloaded',
    timeout: 20000,
  });
  await new Promise((r) => setTimeout(r, 3500));

  const stopXPath =
    './/tr[contains(., "Tên thang điểm")][contains(., "Khả dụng")][contains(., "Ngừng sử dụng")]//a[contains(., "Ngừng sử dụng")]';
  const confirmXPath = './/button[contains(., "Xác nhận")]';

  await clickUntil(
    page,
    async () => waitXPath(page, stopXPath, 3000),
    async () => !!(await page.$('xpath/' + confirmXPath)),
    { label: 'Ngừng sử dụng', maxAttempts: 3, checkTimeoutMs: 4000 }
  );

  const confirmBtn = await page.$('xpath/' + confirmXPath);
  await humanClick(page, confirmBtn);
  await new Promise((r) => setTimeout(r, 2500));

  // Verify độc lập: reload + đọc lại toàn bảng, không tin ngay kết quả 1 dòng vừa thao tác.
  await page.reload({ waitUntil: 'domcontentloaded' });
  await new Promise((r) => setTimeout(r, 3000));
  const rows = await page.$$eval('table tr', (trs) => trs.map((tr) => tr.innerText));
  const targetRow = rows.find((r) => r.includes('Tên thang điểm') && r.includes('Ngừng dùng'));

  return {
    pass: !!targetRow,
    resultText: targetRow
      ? 'Xác nhận đúng: sau khi Ngừng sử dụng, trạng thái chuyển "Ngừng dùng".'
      : 'FAIL: không thấy trạng thái Ngừng dùng sau khi xác nhận.',
  };
}
```

## Ngoài phạm vi

- Không tự động hoá case cần **tài khoản test thứ 2** (permission/phân quyền) — DỪNG, ghi chú vào Sheet "cần QC chuẩn bị thêm tài khoản".
- Không đụng gì tới repo `fastdo-server` — đây là repo hoàn toàn tách biệt.
- Không dùng MCP `web-tester-mcp-server` cho phần ghi Sheet/quay video/upload — chỉ tự viết Puppeteer. MCP `sheet_read` (đọc) vẫn dùng bình thường nếu có sẵn.
