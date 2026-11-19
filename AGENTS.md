# AGENTS.md — Messenger Bot Orchestrator (`F:\Dev\msg`)

## 1. Start here (read first)

Before writing or changing any code, read in this order:

1. `ref/index.md` — master index mapping every reference guide.
2. `ref/serverless-bot/` — Node.js Telegram serverless (`tgcloud`) bot guide (`SKILL.md`, `telegram_serverless_guide.pdf`).
3. `ref/relay/` — Cloudflare relay for bypassing Telegram network restrictions (`telegram-cloudflare-relay.md`, `worker.js`, `wrangler.jsonc`).
4. `ref/guide/` and `ref/human/` — additional reference guides and plain-language notes.
5. `ref/agent/` — agent-facing per-API references (Telegram, channel-messaging, etc.).

Then check `.agents/` skills. Use the **`graphify`** skill to query the codebase knowledge graph in `graphify-out/` rather than reading every file from scratch. Refresh the graph after code changes (see §3).

## 2. Project purpose

Build a **Node.js** Telegram Channel broadcaster (Phase 1) on Telegram's serverless platform (`tgcloud`), deployed via **GitHub Actions** (local network cannot push directly to `tgcloud`), with a **Cloudflare relay** (`ref/relay/`) to bypass Telegram network restrictions, plus a **mountable Node.js API & Admin UI** that plugs into an existing running website.

Strict runtime rule: **Node.js only** — no Python for the bot, scripts, or API.

Messenger support is structured with an extensible `DestinationAdapter` interface (`tgcloud/lib/adapter.js`). `TelegramChannelAdapter` is active now; `adapters/`/`destinations/` structure is reserved for Discord, Slack, WhatsApp, etc.

## 3. Codebase mapping via `graphify`

`graphify-out/` holds a persistent knowledge graph of the codebase + docs. Agents must query it first (`graphify query "..."`) instead of reading every file.

How agents use it:
- `graphify query "<question>"` — BFS traversal for broad context ("How does the relay route a sendMessage?", "Where is the channel adapter defined?").
- `graphify query "<question>" --dfs` — trace a specific call path.
- `graphify path "NodeA" "NodeB"` — shortest path between two concepts.
- `graphify explain "NodeName"` — plain-language explanation of a node.
- `graphify update` — incremental rebuild of only new/changed files (run after code changes).
- `graphify extract . --code-only --no-cluster` — fast full rebuild (no LLM/API key needed).

Exclusions (never index): `node_modules/`, build/cache outputs, `graphify-out/` itself, lockfiles (`package-lock.json`), `.env`/secrets. See `.gitignore`.

Graphify commands and their meaning are documented in `docs/agents-and-graphify.md`.

Refresh cadence: run `graphify update` after any change to `tgcloud/`, `src/`, `.github/`, or `docs/` so the graph stays current.

## 4. Code conventions (Node.js)

- **Language:** Node.js (ES modules, `"type": "module"` where a `package.json` exists; `.js` extension required on relative imports inside `tgcloud/`).
- **tgcloud runtime sandbox** (`ref/serverless-bot/SKILL.md`): modules may import only `sdk` (or `sdk/api`, `sdk/db`, `sdk/fetch`) and local modules inside `tgcloud/`. No npm packages, no Node built-ins (`fs`, `path`, `crypto`), no filesystem access. `handlers/` and `endpoints/` must stay flat; `lib/` may have subdirectories.
- Handler signature: `export default async function (payload, ctx)` — `payload` is the unwrapped update object, `ctx.update` is the raw Telegram Update.
- All `db` terminal methods return Promises — `await` them. No `.references()`/foreign keys (throws at definition time).
- Relative imports inside `tgcloud/` must include the `.js` extension (`./relay.js`, `../schema.js`).
- Config comes from environment variables (`.env` locally; GitHub Secrets in Actions; Cloudflare variables/secrets for the relay). Never hardcode tokens. `.env` is git-ignored — never commit it.
- Errors: throw on Bot API failure; handlers catch `BotApiError` from `sdk`.
- Formatting: 2-space indent, single quotes, semicolons, LF line endings (`.gitattributes`).

## 5. Commands

| Purpose | Command | Notes |
|---|---|---|
| Install deps | `npm install` | Host-side mountable hub only; `tgcloud/` uses no npm deps |
| Lint (host hub) | `npm run lint` | if `lint` script present |
| Typecheck | `npm run typecheck` | if TypeScript/typecheck script present |
| Test | `npm test` | if test script present |
| tgcloud deploy | `npx tgcloud push` then `npx tgcloud migrate` then `npx tgcloud webhook sync` | runs in GitHub Actions (see `.github/workflows/deploy-tgcloud.yml`) |
| tgcloud local test | `npx tgcloud run handlers/message '<json>'` | runs locally on platform V8 isolate |
| graphify build | `graphify extract . --code-only --no-cluster` | fast, no API key |
| graphify refresh | `graphify update` | incremental after changes |
| graphify query | `graphify query "<question>"` | query the knowledge graph |

`tgcloud` deployments run via **GitHub Actions** on `ubuntu-latest` because the local machine has a restricted network and cannot reliably push directly to `tgcloud`. Do not run `tgcloud push` from a local dev machine unless network access is confirmed.

## 6. Boundaries

- **Code** (`tgcloud/`, `src/`, `.github/`): writable, owned by agents. This is where features live.
- **`AGENTS.md`**: writable by agents; the orchestrator for this repo. Keep it current when commands/paths change.
- **`docs/`**: human-readable documentation owned by agents; regenerate/rewrite when architecture or setup changes.
- **`ref/`**: **read-only reference guides**. Do not edit `ref/` files. They describe Telegram, the relay, and other messenger APIs and are the source of truth for platform behavior.

## 7. Secrets & env

Never commit secrets. Required `.env` values / GitHub Secrets are listed in `.env.example` and `docs/setup-and-mounting.md`.

- Local: copy `.env.example` → `.env` and fill in values.
- GitHub Actions: set repository Secrets (`TGCLOUD_TOKEN`, `TELEGRAM_BOT_TOKEN`, `TARGET_TELEGRAM_CHANNEL_ID`, `ALLOWED_TELEGRAM_USER_ID`, `RELAY_URL`, `ADMIN_SECRET`, etc.).
- Relay: Cloudflare variables/secrets per `ref/relay/` (`PATH_PREFIX`, `ALLOWED_BOT_IDS`, `WEBHOOK_SECRET`, ...).
