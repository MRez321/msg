# Sending a Message to a Channel via API — Agent Reference

> Audience: coding agents. Written 2026-11-16. Covers Bale, Eitaa, Rubika, Soroush+, Telegram.
> Tags: `[VERIFIED-OFFICIAL]`, `[THIRD-PARTY]`, `[USER-PROVIDED]`, `[NOT VERIFIED]`. Placeholders in `<angle brackets>`.
> Rule for agents: never invent a parameter that is not listed here. If a needed fact is `[NOT VERIFIED]`, test against the live API first.

## Summary table
| | Telegram | Bale | Rubika | Soroush+ | Eitaa |
|---|---|---|---|---|---|
| Endpoint | `https://api.telegram.org/bot<token>/sendMessage` | `https://tapi.bale.ai/bot<token>/sendMessage` | `https://botapi.rubika.ir/v3/<token>/sendMessage` | `https://api.splus.ir/bot<token>/sendMessage` | `https://eitaayar.ir/api/<token>/sendMessage` (third-party) **or** `https://eitaayar.ir/api/app/sendMessage` (user file) — conflict |
| Channel id form | `@channelusername` or numeric id | `@channelusername` (also numeric string/int) | GUID string, e.g. `c0…` (third-party) | `[NOT VERIFIED]` (Telegram-like expected) | numeric channel id or username without `@` (third-party) |
| Required fields | chat_id, text | chat_id, text | chat_id, text | `[NOT VERIFIED]` | chat_id, text |
| Body format | JSON/form/query | JSON/form/query | JSON only | JSON (third-party example) | `[NOT VERIFIED]` |
| Bot-in-channel requirement | admin right to post: `[NOT VERIFIED]` on pages read | `[NOT VERIFIED]` (promoteChatMember has `can_post_messages`) | `[NOT VERIFIED]` | `[NOT VERIFIED]` | register bot **@Sender** in the channel (third-party) |

## Telegram
- `[VERIFIED-OFFICIAL]` Endpoint/format: `POST https://api.telegram.org/bot<token>/sendMessage`; params may be JSON. `Chat.type` can be `channel`; channel posts arrive as `channel_post` updates; `Message.from` may be empty for channel messages; `author_signature` carries post author signature.
- `[THIRD-PARTY]` (aiogram mirror of official docs) `chat_id`: "Unique identifier for the target chat or username of the target channel (in the format `@channelusername`)"; `text` required.
- `[THIRD-PARTY]` `message_thread_id` is only for forum supergroups/private topic chats, not channels.
- `[NOT VERIFIED]` The exact admin permission needed to post in a channel (the official `promoteChatMember` parameter table was not retrieved).
```bash
curl -X POST "https://api.telegram.org/bot<token>/sendMessage" \
  -H "Content-Type: application/json" \
  -d '{"chat_id":"@channelusername","text":"Hello channel"}'
```
Success: `{"ok":true,"result":{…Message…}}` `[VERIFIED-OFFICIAL]` envelope.

## Bale
- `[VERIFIED-OFFICIAL]` `sendMessage`: `chat_id` (String or Integer) = target chat id **or channel username `@channelusername`**; `text` 1–4096 chars; optional `reply_to_message_id`, `reply_markup`. Returns the sent `Message`.
- `[VERIFIED-OFFICIAL]` Bot permissions exist for channels: `promoteChatMember` has `can_post_messages`; `deleteMessage` in a channel needs `can_delete_messages`; `getChat` returns type `channel`.
- `[NOT VERIFIED]` An explicit statement that the bot must be a channel admin to post (not on the fetched page).
- `[VERIFIED-OFFICIAL]` Formatting is via inline markers in `text` (see `bale.md` §8); no `parse_mode`.
```bash
curl -X POST "https://tapi.bale.ai/bot<token>/sendMessage" \
  -H "Content-Type: application/json" \
  -d '{"chat_id":"@channelusername","text":"Hello channel"}'
```
Files to a channel: same `chat_id` with `sendPhoto/sendDocument/sendVideo/sendAudio/sendVoice/sendAnimation/sendMediaGroup` (see `bale.md`).

## Rubika
- `[VERIFIED-OFFICIAL]` `POST https://botapi.rubika.ir/v3/<token>/sendMessage`, JSON: `chat_id` (str), `text` (str); optional `disable_notification`, `reply_to_message_id`, `inline_keypad`, `chat_keypad`, `chat_keypad_type`. Output: `message_id`.
- `[THIRD-PARTY]` Channel ids are GUIDs beginning `c0` (SDK examples: `CHANNEL_GUID = "c0xABCDEF..."`).
- `[NOT VERIFIED]` How to obtain a channel GUID; whether the bot must be admin; whether `chat_keypad` is meaningful in channels.
```bash
curl --location -g --request POST 'https://botapi.rubika.ir/v3/<token>/sendMessage' \
  --header 'Content-Type: application/json' \
  --data-raw '{"chat_id":"<channel_guid>","text":"Hello channel"}'
```
Files: `requestSendFile` → upload → `sendFile` (see `rubika.md` §6).

## Soroush+
- `[USER-PROVIDED]` Base: `https://api.splus.ir/bot<token>/METHOD_NAME`. `[THIRD-PARTY]` `POST …/sendMessage` with JSON works (pyconnection README).
- `[THIRD-PARTY]` API is Telegram-modelled; SDKs register a `channel_post` handler, so channel posts exist as an update type.
- `[NOT VERIFIED]` Required body fields, channel id format, admin requirements. Expect `chat_id` + `text` by analogy only; test before relying.

## Eitaa
- `[THIRD-PARTY]` Token from https://eitaayar.ir account → API section. Register bot **@Sender** in the channel/super-group (PyEitaa README).
- `[THIRD-PARTY]` `sendMessage` params: `chat_id` (channel id or username without `@`; for a group, its invite link per eitaa-pykit), `text`; optional `title`, `disable_notification`, `reply_to_message_id`, `date` (Unix timestamp = scheduled send), `pin`, `viewCountForDelete`.
- `[THIRD-PARTY]` Files: `sendFile` with `chat_id`, file upload, `caption`.
- `[NOT VERIFIED]` HTTP verb, content type, base URL form (see conflict in `eitaa.md` §3), response JSON.
```bash
# URL form from third-party SDK; verify the base URL first
curl -X POST "https://eitaayar.ir/api/<token>/sendMessage" \
  -d "chat_id=<channel_id_or_username>" -d "text=Hello channel"
```

## Cross-API checklist for an agent
1. Obtain token from the platform's bot-creation flow (Telegram @BotFather; Bale @botfather; Soroush+ splus.ir/botfather; Eitaa eitaayar.ir; Rubika `[NOT VERIFIED]`).
2. Add the bot to the channel with posting rights (exact right: see table; mostly `[NOT VERIFIED]`).
3. Use the platform's channel id form (table above).
4. POST the message; read `ok`/`status` and the returned message id.
5. Treat every `[NOT VERIFIED]` item as something to test, not assume.

## References used
Telegram: https://core.telegram.org/bots/api ; https://docs.aiogram.dev/en/v3.17.0/api/methods/send_message.html
Bale: https://docs.bale.ai
Rubika: https://rubika.ir/botapi/methods ; https://pypi.org/project/Rubka/
Soroush+: https://github.com/SalesmanMNRA/pyconnection ; https://github.com/AmirRedox2008/soroushpluslite
Eitaa: https://github.com/ADanayi/PyEitaa ; https://pypi.org/project/pyeitaa/ ; https://pypi.org/project/eitaa-pykit/1.1/ ; https://github.com/sirdadfar/iran-messenger-bot
