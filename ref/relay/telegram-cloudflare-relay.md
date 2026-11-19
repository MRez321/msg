# Telegram Bot API through a Cloudflare Worker Relay

> For coding agents and humans. Written 2026-11-16. Files in this folder: `worker.js` (the relay), `wrangler.jsonc` (minimal config), this guide.
> Evidence tags: `[VERIFIED-OFFICIAL]` Telegram official docs read 2026-11-16 · `[VERIFIED-CF]` Cloudflare official docs (developers.cloudflare.com, read via search results 2026-11-16) · `[THIRD-PARTY]` library docs mirroring Telegram text · `[DESIGN]` a decision made in `worker.js` (not a fact about Telegram/Cloudflare) · `[TESTED-MOCK]` verified by my local mock test only · `[NOT VERIFIED]`.

## 1. What this is and the key idea
`[DESIGN]` `worker.js` is a **transparent reverse proxy**. It never parses, rewrites or re-encodes request or response bodies; it forwards the raw byte stream. Because of that, every Telegram feature that works over HTTP passes through: JSON, urlencoded and query-string calls, multipart file uploads, text with `parse_mode` or `entities`, captions, keyboards, media groups, rich messages, payments, inline mode, file downloads, webhook calls, and any method added in future Bot API versions. Whether a feature *works* is decided by Telegram, not by the relay. The relay has no per-method list that could go stale. `[TESTED-MOCK]` JSON with Persian text and emoji arrived byte-identical, and a multipart upload kept its boundary and file part.

Your client talks to the relay instead of `api.telegram.org`:
```
https://<your-worker-domain>/bot<TOKEN>/<METHOD>          -> https://api.telegram.org/bot<TOKEN>/<METHOD>
https://<your-worker-domain>/file/bot<TOKEN>/<file_path>  -> https://api.telegram.org/file/bot<TOKEN>/<file_path>
```

## 2. Telegram facts the relay relies on
- `[VERIFIED-OFFICIAL]` Calls go to `https://api.telegram.org/bot<token>/METHOD_NAME`; methods are case-insensitive; UTF-8.
- `[VERIFIED-OFFICIAL]` GET and POST are supported. Parameters may be sent as URL query string, `application/x-www-form-urlencoded`, `application/json` (not for uploads), or `multipart/form-data` (for uploads). All four pass through unchanged.
- `[VERIFIED-OFFICIAL]` Responses are JSON: `ok`, then `result` or `description` + `error_code`.
- `[VERIFIED-OFFICIAL]` Webhooks: `setWebhook` needs an HTTPS `url`; allowed ports 443, 80, 88, 8443; Telegram can send a `secret_token` (1–256 chars of `A-Z a-z 0-9 _ -`) in header `X-Telegram-Bot-Api-Secret-Token`; on non-2xx Telegram retries and eventually gives up. You can answer a webhook by returning a Bot API call in the HTTP response (a `method` parameter); the relay returns your server's response untouched, so this keeps working.
- `[VERIFIED-OFFICIAL]` A self-hosted Bot API server (github.com/tdlib/telegram-bot-api) allows uploads up to 2000 MB, downloads without limit and HTTP webhooks. The relay can point at it via `UPSTREAM`.
- `[THIRD-PARTY]` Download link after `getFile`: `https://api.telegram.org/file/bot<token>/<file_path>`, valid at least 1 hour. On the official cloud server bots can download files up to 20 MB and upload up to 50 MB (grammY guide, docs.rs getFile text).
- `[NOT VERIFIED]` Telegram's official upload/download size table was not on the part of the page I could read; treat 20/50 MB as library-reported.

## 3. Cloudflare facts that affect the relay (`[VERIFIED-CF]`)
| Topic | Fact |
|---|---|
| Request body size | Depends on your Cloudflare **account plan**, not the Workers plan: Free 100 MB, Pro 100 MB, Business 200 MB; Enterprise adjustable up to 5 GB. Bigger requests get `413`. |
| Response body size | No enforced limit. |
| CPU time | Free: 10 ms per request. Paid: default 30 s, up to 5 min. Time spent **waiting on `fetch()`** does not count as CPU time. |
| Duration | No hard limit for HTTP-triggered Workers while the client stays connected. This is why long polling (`getUpdates` with `timeout`) can pass through. |
| Subrequests | Free 50 per request, Paid 10,000. The relay uses 1 per call. |
| Requests | Free plan: 100,000 per day (long polling spends one request per poll cycle). |
| URL size | 16 KB. A GET with a very long `text=` can exceed it; use POST for long content. |
| Headers | 128 KB total request / response headers. |
| Memory | 128 MB. The relay streams bodies instead of buffering, which is why large files do not need memory. |
| Variables | Free 64 / Paid 128 per Worker, each up to 5 KB. |
| Error 1102 | "Worker exceeded resource limits" when CPU time is exceeded. |
Practical consequence: Telegram's own 50 MB upload cap on the cloud server is below Cloudflare's 100 MB request cap, so normal bot uploads fit. Only a self-hosted server (up to 2000 MB) can exceed the Cloudflare cap on non-Enterprise plans.

## 4. Everything that passes through
| Feature | Passes? | Why |
|---|---|---|
| All current and future methods | Yes | Path forwarded as-is; no method whitelist `[DESIGN]` |
| Plain text, `parse_mode` (`HTML`, `MarkdownV2`), `entities`, captions | Yes | Body bytes unchanged |
| Keyboards, inline keyboards, callbacks, polls, payments, Stars, stickers, forum, business, rich messages (10.1+) | Yes | Same |
| Multipart uploads (photo, document, video, audio, voice, sticker files) | Yes | Streamed; boundary header kept `[TESTED-MOCK]` |
| File by `file_id` or by URL | Yes | Just JSON/form fields |
| Downloads via `/file/bot…/…` | Yes | Streamed, not forced to `no-store` `[TESTED-MOCK]` |
| `getUpdates` long polling | Yes | See Duration above |
| Webhook (Telegram → worker → your server) | Yes, optional | `WEBHOOK_ORIGIN`; secret header kept `[TESTED-MOCK]` |
| Webhook reply with a method call | Yes | Your server's response returned unchanged |
| Self-hosted Bot API server | Yes | `UPSTREAM` |
| Extra path segments such as `/bot<TOKEN>/test/METHOD` | Yes | Anything after the token is forwarded `[TESTED-MOCK]` |
Not passed on purpose `[DESIGN]`: client-identity headers (`cf-*`, `x-forwarded-*`, `x-real-ip`, `forwarded`, `true-client-ip`, `cdn-loop`, hop-by-hop headers), so Telegram does not see your end users' IPs. Methods other than GET, POST, HEAD return 405 (Telegram's page documents GET and POST only).

## 5. Deploy
### Dashboard (simplest)
1. Cloudflare dashboard → **Workers & Pages** → create a Worker → paste the contents of `worker.js` → deploy. (Settings live under Workers & Pages → your Worker → Settings, `[VERIFIED-CF]`.)
2. In Settings add variables (below). Put `WEBHOOK_SECRET` in as a secret.
3. Attach a custom domain or use the Worker's default address. `[NOT VERIFIED]` whether the default `*.workers.dev` address is reachable from your network. Test it before building on it.
### Wrangler
`wrangler.jsonc` is a minimal config (`name`, `main`, `compatibility_date`, optional `vars`). Deploying with `npx wrangler deploy` is the standard Wrangler flow, `[NOT VERIFIED]` in this session.

## 6. Configuration (`worker.js` variables, all optional)
| Variable | Meaning |
|---|---|
| `PATH_PREFIX` | Secret path segment. Use `https://relay/<prefix>/bot<TOKEN>/…`; anything without it gets 404. |
| `ALLOWED_BOT_IDS` | Comma-separated numeric bot ids (the part of a token before `:`). Other bots get 403. |
| `UPSTREAM` | Default `https://api.telegram.org`; set to your own Bot API server. |
| `WEBHOOK_ORIGIN` | Enables inbound webhook forwarding to this origin. |
| `WEBHOOK_PATH` | Inbound segment, default `_hook`. |
| `WEBHOOK_SECRET` | Require this value in `X-Telegram-Bot-Api-Secret-Token` on inbound webhooks, else 401. |
Token format `[VERIFIED-OFFICIAL]`: `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11` — bot id is `123456`.

## 7. Usage examples (placeholders in `<>`)
Send formatted text (JSON):
```bash
curl -X POST "https://<relay>/<prefix>/bot<TOKEN>/sendMessage" \
  -H "Content-Type: application/json" \
  -d '{"chat_id":"@channelusername","text":"<b>Hello</b> <i>world</i>","parse_mode":"HTML"}'
```
Upload a file with a caption (multipart):
```bash
curl -X POST "https://<relay>/<prefix>/bot<TOKEN>/sendDocument" \
  -F chat_id=<chat_id> -F document=@report.pdf -F caption="Monthly report"
```
Download a file:
```bash
curl "https://<relay>/<prefix>/bot<TOKEN>/getFile?file_id=<file_id>"        # returns file_path
curl -O "https://<relay>/<prefix>/file/bot<TOKEN>/<file_path>"
```
Long polling: `https://<relay>/<prefix>/bot<TOKEN>/getUpdates?timeout=30` (`timeout` is a verified `getUpdates` parameter).
Inbound webhook:
1. Set `WEBHOOK_ORIGIN=https://your-server.example.com`, `WEBHOOK_SECRET=<random>`.
2. Call `setWebhook` through the relay with `url=https://<relay>/<prefix>/_hook/telegram` and `secret_token=<same random>`.
3. Telegram posts updates to the worker, which forwards them to `https://your-server.example.com/telegram` with the secret header intact.
Using an SDK: point its API base URL at `https://<relay>/<prefix>/`. `[NOT VERIFIED]` per SDK; check that your SDK supports a custom base URL and whether it appends `/bot<token>/` itself.

## 8. Security notes
- `[DESIGN]` The token is in the URL path (that is how Telegram's API works). Anyone who can read the relay's logs or your client's URLs sees it. Do not log full URLs.
- `[DESIGN]` An unprotected relay lets strangers spend **your** Cloudflare request quota using their own bots. Set `ALLOWED_BOT_IDS` and a `PATH_PREFIX`.
- `[DESIGN]` `PATH_PREFIX` is an obscurity layer, not authentication. `ALLOWED_BOT_IDS` is the stronger control.
- `[DESIGN]` Inbound webhook comparison of the secret is a plain string compare.
- Cloudflare terms of service for proxying traffic through Workers: `[NOT VERIFIED]`; check them for your use.

## 9. Limitations and honest unknowns
- `worker.js` was **never run against real Cloudflare or real Telegram**. The `[TESTED-MOCK]` results come from 25 checks against a mock upstream in Node 22 (routing, header stripping, allow-list, prefix, webhook, 502 envelope). Deploy and run the smoke test in §10 first.
- `[NOT VERIFIED]` Behaviour of `Content-Encoding` for compressed upstream responses. Telegram's JSON is small; test a file download through the relay.
- `[NOT VERIFIED]` Whether Telegram throttles or blocks requests from Cloudflare's IP ranges.
- The relay returns `{ "ok": false, "error_code": 502|403|404|405|401, "description": … }` for its **own** errors. This mimics Telegram's documented envelope but these codes are `[DESIGN]`, not Telegram's.
- Free plan CPU is 10 ms per request; passthrough needs little CPU, but check Metrics for Error 1102 under load.
- A request body above your plan cap fails with 413 before the Worker runs.

## 10. Smoke test
```bash
curl "https://<relay>/<prefix>/bot<TOKEN>/getMe"                  # expect {"ok":true,...}
curl "https://<relay>/bot<TOKEN>/getMe"                           # expect 404 if PATH_PREFIX is set
curl "https://<relay>/<prefix>/bot999:x/getMe"                    # expect 403 if ALLOWED_BOT_IDS excludes 999
```
Then send a text, a multipart file under 50 MB, and download it back.

## 11. References used
- https://core.telegram.org/bots/api (fetched 2026-11-16; truncated) and https://core.telegram.org/bots/api-changelog
- https://developers.cloudflare.com/workers/platform/limits/ and https://developers.cloudflare.com/workers/writing-workers/resource-limits/ (via search results)
- https://grammy.dev/guide/files and https://docs.rs/tgbot/latest/tgbot/types/struct.GetFile.html (file download URL, 20 MB / 50 MB)
- https://github.com/tdlib/telegram-bot-api (named on the official Telegram page)
