# Setup & Mounting — Msg Broadcaster

Step-by-step guide to configuring secrets, deploying the `tgcloud` bot via GitHub
Actions, using the Cloudflare relay, and mounting the Node.js API & Admin UI into
your existing running website.

## Prerequisites

- Node.js (v20+) locally for testing.
- A Telegram bot token from @BotFather.
- The bot added to your target channel as an administrator with posting rights.
- Your Telegram user ID (for `ALLOWED_TELEGRAM_USER_ID`) — get it from @userinfobot.
- GitHub repository with Secrets configured (below).
- (Optional) A deployed Cloudflare Worker relay per `ref/relay/`.

## 1. Environment (local)

Copy the example file and fill in values. `.env` is git-ignored — never commit it.

```bash
cp .env.example .env
# edit .env with your values
```

`.env.example` fields:
| Variable | Required | Meaning |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | yes | Bot token from @BotFather |
| `TARGET_TELEGRAM_CHANNEL_ID` | yes | `@channelusername` or numeric channel id |
| `ALLOWED_TELEGRAM_USER_ID` | yes | Your Telegram user id (only you can drive the bot) |
| `RELAY_URL` | no | Relay base, e.g. `https://relay.mrez321.ir` |
| `RELAY_PATH_PREFIX` | no | Relay `PATH_PREFIX` secret segment, if set |
| `ADMIN_SECRET` | yes | Secret protecting the mountable hub API/dashboard |
| `RETRY_ATTEMPTS`, `RETRY_DELAY`, `TIMEOUT`, `DEBUG_MODE` | no | Tuning (defaults shown in `.env.example`) |

## 2. GitHub Secrets (for tgcloud deployment)

Add these to your GitHub repository **Settings → Secrets and variables → Actions**:

| Secret | Value | Notes |
|---|---|---|
| `TGCLOUD_TOKEN` | yes | CLI access token (`app<id>:<secret>`) from @BotFather / tgcloud |
| `TELEGRAM_BOT_TOKEN` | yes | Same as `.env` |
| `TARGET_TELEGRAM_CHANNEL_ID` | yes | Same as `.env` |
| `ALLOWED_TELEGRAM_USER_ID` | yes | Same as `.env` |
| `RELAY_URL` | no | Relay base URL |
| `RELAY_PATH_PREFIX` | no | Relay path prefix |
| `ADMIN_SECRET` | no | Hub admin secret |

The workflow maps each secret into an env var read by tgcloud at runtime.

## 3. Deploy via GitHub Actions (tgcloud)

The workflow `.github/workflows/deploy-tgcloud.yml` triggers on pushes to
`tgcloud/**` and on manual `workflow_dispatch`. It runs on `ubuntu-latest`
because the local network cannot push directly to `tgcloud` (`[Certain]`).

Steps:
1. `npx tgcloud login` — authenticate with `TGCLOUD_TOKEN`.
2. `npx tgcloud push` — bundles `tgcloud/` code + schema and deploys.
3. `npx tgcloud migrate --yes` — applies safe + warning database migrations.
4. `npx tgcloud webhook sync` — realigns the webhook and `allowed_updates`.

Trigger manually:
- GitHub → Actions → "Deploy Telegram Broadcaster to tgcloud" → Run workflow.

Local smoke test (optional, runs on the platform V8 isolate):
```bash
npx tgcloud run handlers/message '{ "chat": { "id": 12345 }, "from": { "id": <ALLOWED_TELEGRAM_USER_ID> }, "text": "/start" }'
```

## 4. Cloudflare relay (bypass Telegram network restrictions)

Deploy the relay worker from `ref/relay/worker.js` (Cloudflare dashboard or
`npx wrangler deploy` with `wrangler.jsonc`). See `ref/relay/telegram-cloudflare-relay.md` for full configuration.

Recommended relay variables/secrets:
- `PATH_PREFIX` — e.g. a random string; requests must start with `/{PREFIX}/bot…`
- `ALLOWED_BOT_IDS` — your bot id (the part of `TELEGRAM_BOT_TOKEN` before `:`)
- `WEBHOOK_SECRET` — only if you forward inbound webhooks

Set `RELAY_URL=https://<your-relay-domain>[/<PATH_PREFIX>]` in `.env` / GitHub Secrets.
The bot automatically routes through the relay when `RELAY_URL` is set.

Relay smoke test (`ref/relay/ §10`):
```bash
curl "https://<relay>/<prefix>/bot<TOKEN>/getMe"            # expect {"ok":true,...}
curl "https://<relay>/bot<TOKEN>/getMe"                     # expect 404 if PATH_PREFIX set
```

## 5. Mount the API & Admin UI into your website

`src/hub.js` is a self-contained ES module. Import it in your site's Node server
and attach `createHub().handler` at your chosen mount path.

Example with Node's built-in `http`:
```js
import { createServer } from 'http';
import { createHub } from './src/hub.js';

const hub = createHub({
  mountPath: '/msg-hub',   // or process.env.MSG_HUB_MOUNT_PATH, e.g. '/api/broadcaster'
  // adminSecret, botToken, channelId, relayUrl, relayPrefix default to process.env
});

const server = createServer(async (req, res) => {
  const handled = await hub.handler(req, res);
  if (handled) return;            // hub owns this path
  // … your existing site routing …
});
server.listen(3000);
```

Example with Express:
```js
import express from 'express';
import { createHub } from './src/hub.js';

const app = express();
const hub = createHub({ mountPath: '/api/broadcaster' });
app.use(hub.mountPath, hub.handler);  // handler matches paths under mountPath
app.listen(3000);
```

`hub.handler` returns `false` for paths outside the mount path so your existing
routes keep working. `hub.mountPath` and `hub.origin(req)` are available for
building links.

### Auto-detected domain & protocol

The hub resolves `protocol` and `host` at runtime from:
1. `x-forwarded-proto` header
2. `x-forwarded-host` header
3. `host` header

This lets the hub work behind reverse proxies/CDNs without hardcoding your domain.
The computed origin appears on the dashboard Status card and in the webhook URL.

## 6. Admin dashboard

Open `https://<your-domain>{mountPath}/` (e.g. `https://example.com/msg-hub/`).
Theme: `#ceae80` accent on obsidian (`#121110`) / charcoal (`#221f1c`) surfaces.

The dashboard shows:
- **Status card** — mount path, detected origin, bot/channel/relay configured state, admin auth.
- **Webhook sync** — computes `{origin}{mount}/telegram` and tells you to run `npx tgcloud webhook sync` via GitHub Actions.
- **Broadcast composer** — send a text (or file_id) to the channel from the web (requires admin secret).
- **Recent logs** — last delivery attempts with status and errors.

All mutating API endpoints require the `ADMIN_SECRET` (sent as `X-Admin-Secret` header or `?secret=` query param).

## 7. Checklist

- [ ] `.env` filled locally (not committed)
- [ ] GitHub repository Secrets set
- [ ] Bot added to channel as admin with posting rights (`[Likely]` required)
- [ ] Relay deployed + smoke test passed (if using RELAY_URL)
- [ ] GitHub Actions workflow run → `tgcloud push`, `migrate`, `webhook sync` succeeded
- [ ] `src/hub.js` mounted on your website at the desired base path
- [ ] Dashboard opens; status card shows bot/channel configured
- [ ] Send a test message from your Telegram user id → appears in channel + confirmation received
