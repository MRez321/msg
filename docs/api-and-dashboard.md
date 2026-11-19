# API & Dashboard — Msg Broadcaster

Reference for the mountable Node.js API & Admin UI (`src/hub.js`), the `#ceae80`
dashboard, and adding future messenger adapters.

## 1. Mounting

`createHub(options)` returns `{ handler, mountPath, origin, logs, addLog }`.

`handler` is an async `(req, res)` function. It returns `true` when it handled
the request (path under `mountPath`), `false` otherwise — so your existing site
routes keep working.

Attach at any base path, e.g. `/msg-hub` or `/api/broadcaster` (env:
`MSG_HUB_MOUNT_PATH`). Origin/protocol are auto-detected per request from
`x-forwarded-proto`, `x-forwarded-host`, then `host` headers.

## 2. API endpoints

Base: `{mountPath}/api/`. All bodies are JSON unless noted.

Auth: mutating endpoints require `ADMIN_SECRET` as header `X-Admin-Secret` or
query `?secret=`. `GET /api/status` is public (values masked where sensitive).

### GET /api/status

Public. Returns hub/runtime status.

Response:
```json
{
  "ok": true,
  "mountPath": "/msg-hub",
  "origin": "https://example.com",
  "botConfigured": true,
  "channelId": "@mychannel",
  "allowedUserId": "(set)",
  "relayConfigured": true,
  "logs": [ … recent logs … ],
  "uptime": 123456
}
```

### POST /api/broadcast

Auth required. Web broadcast composer — sends a message to the channel from the
web.

Body:
```json
{ "chat_id": "@channelusername", "text": "Hello channel" }
```
or media via `copyMessage`:
```json
{ "from_chat_id": 12345, "message_id": 678, "caption": "caption" }
```
`chat_id` defaults to `TARGET_TELEGRAM_CHANNEL_ID` when omitted.

Response (success):
```json
{ "ok": true, "result": { "message_id": 42, … } }
```
Response (failure): `{ "ok": false, "error": "…" }` with HTTP 502.

### POST /api/webhook/sync

Auth required. Computes the webhook URL the bot should use:
`{origin}{mountPath}/telegram`.

Response:
```json
{
  "ok": true,
  "webhookUrl": "https://example.com/msg-hub/telegram",
  "note": "Run `npx tgcloud webhook sync` via GitHub Actions to realign the Telegram Serverless webhook."
}
```
The actual Telegram Serverless webhook is realigned by `npx tgcloud webhook sync`
in the GitHub Actions workflow (the hub cannot run the tgcloud CLI).

### GET /api/logs

Auth required. Returns recent delivery logs (in-memory, last 500, newest first).

```json
{ "ok": true, "logs": [ { "id": "...", "ts": "…", "kind": "telegram|web-broadcast", "type": "text|photo|…", "target": "…", "status": "sent|failed|received", "messageId": 42, "error": null } ] }
```

### POST {mountPath}/telegram

Optional Telegram webhook receiver. Validates `X-Telegram-Bot-Api-Secret-Token`
against `ADMIN_SECRET` (when set), logs the update, returns 200. Use this if you
self-host the webhook instead of relying on tgcloud-managed webhooks.

## 3. Dashboard UI (`#ceae80` theme)

Serves at `GET {mountPath}/` (root of the mount path).

Design tokens (`[Certain]` — implemented in `src/hub.js`):
| Token | Value | Use |
|---|---|---|
| Accent | `#ceae80` | buttons, badges (sent), highlights |
| Background | `#121110` | page (obsidian) |
| Card | `#221f1c` | elevated panels |
| Surface | `#1a1816` | inputs, tiles, mono blocks |
| Primary text | `#f5f2ed` | headings, values |
| Muted text | `#a89f91` | labels, captions |
| Text on accent | `#121110` | buttons (strong contrast) |

Panels:
- **Status** — mount path, detected origin, bot/channel/relay state, admin auth. Refresh button.
- **Webhook sync** — shows computed webhook URL; instructs to run `npx tgcloud webhook sync` via GitHub Actions.
- **Broadcast (web)** — target chat_id + message; send to channel (requires admin secret).
- **Recent logs** — table of delivery attempts (time, kind, type, target, status badge, message id, error).

The dashboard auto-refreshes status every 20s and logs every 15s. Mutating actions
prompt for the admin secret once per session (kept in memory only).

## 4. Adding future messenger adapters

The destination seam is `DestinationAdapter` in `tgcloud/lib/adapter.js`:

```js
export class DestinationAdapter {
  constructor(id) { this.id = id; }
  isAuthorized(userId) { return false; }
  async deliver(update) { throw new DestinationAdapterError('…'); }
  async health() { return { ok: false, error: '…' }; }
}
```

`TelegramChannelAdapter` is the active implementation (id `telegram_channel`).
To add Discord / Slack / WhatsApp / etc.:
1. Create a new adapter class extending `DestinationAdapter` under `tgcloud/lib/`
   (or `tgcloud/adapters/` / `tgcloud/destinations/` — reserved for future use).
2. Implement `isAuthorized`, `deliver(update)`, `health()`.
3. Instantiate it in `tgcloud/handlers/message.js` alongside `TelegramChannelAdapter`
   and route by destination id.

`ref/` is read-only; per-messenger references live in `ref/agent/` (Telegram,
Bale, Rubika, Soroush+, Eitaa, channel-messaging).

## 5. Notes

- Delivery logs in the hub are in-memory and reset on restart; durable logs live
  in tgcloud's SQLite `delivery_logs` table.
- Bot posting to a channel requires the bot to be a channel admin with posting
  rights — `[Likely]` (Telegram docs mark this `[NOT VERIFIED]`; verify after
  deploy with a test message).
- All Bot API calls go through `lib/relay.js` (`sdk/fetch`), routing via the
  Cloudflare relay when `RELAY_URL` is set, else direct to `api.telegram.org`.
