# Msg Broadcaster — Telegram Channel Broadcaster (Phase 1)

Node.js Telegram Channel broadcaster on Telegram's serverless platform (`tgcloud`),
deployed via GitHub Actions with an optional Cloudflare relay, plus a mountable
Node.js API & Admin UI (`#ceae80` theme) that plugs into your existing website.

## What it has

| Component | Location | Purpose |
|---|---|---|
| tgcloud serverless bot | `tgcloud/` | Receives your messages in Telegram, forwards them to the target channel |
| Destination adapter | `tgcloud/lib/adapter.js` | `TelegramChannelAdapter` active; seam for Discord/Slack/WhatsApp later |
| Relay client | `tgcloud/lib/relay.js` | Calls Telegram Bot API via `sdk/fetch`, through Cloudflare relay when set |
| Schema | `tgcloud/schema.js` | SQLite `delivery_logs` (durable delivery history) |
| Config | `tgcloud/lib/config.js` | Env-driven config with masked token logging |
| CI/CD workflow | `.github/workflows/deploy-tgcloud.yml` | GitHub Actions: login → push → migrate → webhook sync |
| Mountable hub | `src/hub.js` | Self-contained Node.js API + `#ceae80` admin dashboard |
| Docs | `docs/` | Architecture, setup & mounting, API & dashboard, agents & graphify |
| Agent orchestrator | `AGENTS.md` | How coding agents should work in this repo |
| Knowledge graph | `graphify-out/` | Queryable codebase map via `graphify` |

## Quick start

1. Copy env example and fill values:
   ```
   cp .env.example .env
   # edit .env (never commit it)
   ```

2. Add GitHub repository Secrets (see "Secrets you must set" below).

3. Deploy via GitHub Actions:
   - Actions → "Deploy Telegram Broadcaster to tgcloud" → Run workflow
   - Or push to `tgcloud/**` to trigger automatically

4. Mount the hub on your website (see `docs/setup-and-mounting.md`).

## Secrets you must set

GitHub repository **Settings → Secrets and variables → Actions**:

| Secret | Required | Value |
|---|---|---|
| `TGCLOUD_TOKEN` | yes | tgcloud CLI access token (`app<id>:<secret>`) |
| `TELEGRAM_BOT_TOKEN` | yes | Bot token from @BotFather |
| `TARGET_TELEGRAM_CHANNEL_ID` | yes | `@channelusername` or numeric channel id |
| `ALLOWED_TELEGRAM_USER_ID` | yes | Your Telegram user id (only you can drive the bot) |
| `RELAY_URL` | no | Cloudflare relay base, e.g. `https://relay.mrez321.ir` |
| `RELAY_PATH_PREFIX` | no | Relay `PATH_PREFIX` secret segment |
| `ADMIN_SECRET` | no | Secret protecting the hub API/dashboard |

Local `.env` mirrors these (copy from `.env.example`, git-ignored).

## What you must do

1. Create the bot with @BotFather and get `TELEGRAM_BOT_TOKEN`.
2. Add the bot to your target channel as an administrator with posting rights.
3. Get your Telegram user id from @userinfobot → `ALLOWED_TELEGRAM_USER_ID`.
4. Set all required GitHub Secrets above.
5. Run the deploy workflow (or push to `tgcloud/**`).
6. Mount `src/hub.js` on your site at your chosen base path (e.g. `/msg-hub`).
7. Open `https://<your-domain>{mountPath}/` for the admin dashboard.

## Node.js only

No Python is used anywhere — bot, scripts, API, and CI are all Node.js.

## Docs

- `docs/architecture.md` — end-to-end architecture
- `docs/setup-and-mounting.md` — step-by-step setup, relay, and mounting
- `docs/api-and-dashboard.md` — API endpoints and `#ceae80` dashboard
- `docs/agents-and-graphify.md` — how `AGENTS.md` + `graphify` work
- `AGENTS.md` — agent orchestration and code conventions
