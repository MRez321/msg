# Architecture — Msg Broadcaster (Phase 1: Telegram Channel)

End-to-end architecture of the Node.js Telegram Channel broadcaster: the
`tgcloud` serverless bot, the Cloudflare relay, the GitHub Actions runner, and
the mountable Node.js API & Admin UI.

## 1. Overview

```
You (Telegram user, ALLOWED_TELEGRAM_USER_ID)
        │  sends text/media
        ▼
Telegram Serverless (tgcloud) ──► handlers/message.js
        │                              │
        │                              ▼
        │                    lib/adapter.js  (DestinationAdapter)
        │                    └─ TelegramChannelAdapter (active)
        │                              │
        │                    lib/relay.js  ──► Cloudflare relay (optional)
        │                              │      (RELAY_URL)
        │                              ▼
        │                    Telegram Bot API ──► TARGET_TELEGRAM_CHANNEL_ID
        │                              │
        │                    confirmation back to your private chat
        ▼
   tgcloud/schema.js  (SQLite: delivery_logs)

GitHub Actions (ubuntu-latest)
        npx tgcloud login → push → migrate → webhook sync

Your existing website ──► mount src/hub.js at /msg-hub (or custom path)
        │
        ├─ API:  GET/POST {mount}/api/{status,broadcast,webhook/sync,logs}
        ├─ UI:   GET {mount}/   (#ceae80 admin dashboard)
        └─ Webhook receiver: POST {mount}/telegram
```

## 2. Components

### A. tgcloud serverless bot (Telegram infrastructure)
Runtime: Telegram's V8 sandbox (`tgcloud`). Sandbox rules (`ref/serverless-bot/SKILL.md`):
- Imports limited to `sdk` (`sdk/api`, `sdk/db`, `sdk/fetch`) and local `tgcloud/` modules.
- No npm packages, no Node built-ins (`fs`, `path`, `crypto`).
- `handlers/` and `endpoints/` stay flat; `lib/` may have subdirectories.
- Relative imports require the `.js` extension.

Files:
- `tgcloud/handlers/message.js` — entry point for `message` updates. Authorizes the sender against `ALLOWED_TELEGRAM_USER_ID`, delivers content to the channel via the adapter, writes a `delivery_logs` row, and replies with a delivery confirmation in the private chat.
- `tgcloud/lib/adapter.js` — `DestinationAdapter` interface (seam) plus `TelegramChannelAdapter` (active). Handles text via `sendMessage` and media (photo/video/document/audio/voice) via `copyMessage` (file_id reuse, no re-upload). Media-group members arrive as separate updates and are delivered individually.
- `tgcloud/lib/relay.js` — `tgCall(token, method, body)` wrapper. Calls the Telegram Bot API through `sdk/fetch`. Routes through the Cloudflare relay when `RELAY_URL` is set (`{RELAY_URL}/bot<TOKEN>/<METHOD>`), otherwise direct to `api.telegram.org`. Supports optional `RELAY_PATH_PREFIX`. Throws `BotApiError` on failure.
- `tgcloud/lib/config.js` — loads `process.env` with fallback defaults; `maskToken()` for safe logging.
- `tgcloud/schema.js` — SQLite `delivery_logs` table (no foreign keys, per tgcloud rules). All `db` terminal methods awaited.

Authorization (`[Certain]`): only `ALLOWED_TELEGRAM_USER_ID` may drive the bot. Other users are ignored silently.

### B. Cloudflare relay (optional, bypasses Telegram network restrictions)
Transparent reverse proxy (`ref/relay/worker.js`) at your `RELAY_URL` (e.g. `https://relay.mrez321.ir`). Forwards raw bytes for any Telegram Bot API method (JSON, multipart, file downloads). `[Likely]` deployed via Cloudflare dashboard or `wrangler` per `ref/relay/`.

Security controls you should set on the relay worker (`ref/relay/telegram-cloudflare-relay.md §6`):
- `PATH_PREFIX` — secret path segment.
- `ALLOWED_BOT_IDS` — comma-separated numeric bot ids (part of token before `:`).
- `WEBHOOK_ORIGIN` / `WEBHOOK_PATH` / `WEBHOOK_SECRET` — only if you use inbound webhook forwarding.

### C. GitHub Actions runner (deployment)
`.github/workflows/deploy-tgcloud.yml` runs on `ubuntu-latest` because the local
machine has a restricted network and cannot push directly to `tgcloud` (`[Certain]`).
Steps: checkout → setup Node → syntax check (`node --check`) → `npx tgcloud login` →
`npx tgcloud push` → `npx tgcloud migrate --yes` → `npx tgcloud webhook sync`.
Secrets map from GitHub repository Secrets into env vars read by tgcloud.

### D. Mountable Node.js API & Admin UI (your existing website)
`src/hub.js` — dependency-free ES module (native `http` + `fetch`, no Express).
Exports `createHub(options)` returning a `(req, res)` handler you attach to your
site's router/server at a custom base path (`MSG_HUB_MOUNT_PATH`, e.g. `/msg-hub`
or `/api/broadcaster`).

- Auto-detects `protocol` and `host` from `x-forwarded-proto`, `x-forwarded-host`,
  then `host` headers, with optional env override. Operates relative to the mount path.
- API (protected by `ADMIN_SECRET`, except `/api/status`):
  - `GET {mount}/api/status` — mount, origin, bot/channel/relay configured state, recent logs.
  - `POST {mount}/api/broadcast` — web broadcast to channel (text or file_id via copyMessage).
  - `POST {mount}/api/webhook/sync` — returns computed webhook URL `{origin}{mount}/telegram`;
    realign the tgcloud webhook via `npx tgcloud webhook sync` in GitHub Actions.
  - `GET {mount}/api/logs` — recent delivery logs (in-memory, last 500).
  - `POST {mount}/telegram` — optional Telegram webhook receiver (validates `X-Telegram-Bot-Api-Secret-Token`).
- UI: `GET {mount}/` — `#ceae80` admin dashboard on obsidian/charcoal surfaces.

## 3. Data flow (broadcast)

1. You send a message (text/photo/video/document/audio/voice) to the bot in a private chat.
2. tgcloud `handlers/message.js` checks `ALLOWED_TELEGRAM_USER_ID`.
3. `TelegramChannelAdapter.deliver()` forwards to `TARGET_TELEGRAM_CHANNEL_ID`:
   - text → `sendMessage(chat_id=channel, text, parse_mode=HTML)`
   - media → `copyMessage(from_chat_id=your chat, message_id=...)` (file_id reuse)
4. tgCall routes via Cloudflare relay if `RELAY_URL` set, else direct.
5. Delivery row written to `delivery_logs`; confirmation sent back to your chat.

## 4. Extending to other messengers

Add a new file under `tgcloud/lib/` implementing `DestinationAdapter` (see `adapter.js`),
instantiate it alongside `TelegramChannelAdapter`, and route by destination id. Reserve
`tgcloud/adapters/` or `tgcloud/destinations/` for Discord, Slack, WhatsApp, etc.
`ref/` is read-only; messenger-specific references live in `ref/agent/`.

## 5. Confidence notes

- tgcloud reads `process.env` at runtime: `[Likely]` (per SKILL.md config guidance; exact sandbox env surface not independently verified).
- `copyMessage`/`sendMessage` require the bot to be a channel admin with posting rights: `[Likely]` (Telegram channel-messaging guidance marks admin requirement `[NOT VERIFIED]`; test after deploy).
- Cloudflare relay `*.workers.dev` default address reachability from your network: `[NOT VERIFIED]` — test with the relay smoke test (`ref/relay/ §10`) before relying on it.
