# Fastdo Test Auto

Bộ công cụ QA automation cho các testcase trong Google Sheet "fEvaluation" của Fastdo. Xem hướng dẫn đầy đủ tại [`.claude/skills/fastdo-eval-runner/SKILL.md`](.claude/skills/fastdo-eval-runner/SKILL.md).

## Yêu cầu môi trường

1. **Node.js** đã cài sẵn.
2. **ffmpeg** đã có trong PATH — kiểm tra bằng `ffmpeg -version`.
3. **Google Chrome** mở sẵn với cờ debug, ví dụ:
   ```
   "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222
   ```
   Kiểm tra đã bật đúng bằng: `curl -s http://localhost:9222/json/version`

## Cài đặt lần đầu

```bash
npm install
```

## Chạy test

Mở Claude Code với working directory là thư mục này, gõ "chạy EVAL_xxx" — skill `fastdo-eval-runner` sẽ tự kích hoạt và làm theo `SKILL.md`.
