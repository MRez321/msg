# Soroush Plus (سروش‌پلاس) Bot API — Agent Reference

> Audience: coding agents. Written 2026-11-16.
> **IMPORTANT:** the official docs (https://soroushplus.com/en/p/documents) block automated access (robots.txt). Nothing below was read from the official page. Facts are `[THIRD-PARTY]` (SDK READMEs; one claims to be verified against the official docs, which I could not confirm), `[USER-PROVIDED]`, or `[NOT VERIFIED]`.

## 1. What this API is capable of
`[THIRD-PARTY]` A Bot API **modelled on the Telegram Bot API but not identical** (soroushpluslite README). Documented-by-SDK capabilities:
- Receive updates: long polling `getUpdates`, webhooks.
- Send: text, photo, document, video, audio, voice, animation, sticker (WEBP/TGS/WEBM), location, contact, media group.
- Forward, copy, getFile, deleteMessage.
- Edit: editMessageText, editMessageCaption, editMessageMedia, editMessageReplyMarkup (martsor README).
- Inline keyboards (buttons: `text` + `url` or `callback_data` only), callback queries, reply keyboards, force reply.
- Command menu: `setMyCommands` / `getMyCommands` / `deleteMyCommands`.
- Parse modes: MarkdownV2 / HTML (martsor README).
- Content types seen in updates: text, audio, document, animation, photo, sticker, video, video_note, voice, location, contact, new_chat_members, left_chat_member, new_chat_title, pinned_message; handlers exist for `channel_post` and `edited_message`.
`[THIRD-PARTY]` NOT supported (per soroushpluslite): inline mode, polls, dice, venue, web-app/login-url buttons, payments (`sendInvoice`), group-admin methods (`banChatMember`, invites…).
`[THIRD-PARTY]` Marked "coming soon" (به‌زودی) in upstream docs per soroushpluslite: `getChat`, `getUserProfilePhotos`, `sendChatAction`, `getStickerSet`, pin/unpin. CONFLICT: martsor lists `getChat` as supported. Status `[NOT VERIFIED]`.

## 2. What it needs to work
- `[THIRD-PARTY]` Token from the BotFather inside Soroush Plus: https://splus.ir/botfather
- `[USER-PROVIDED]` + `[THIRD-PARTY]` Base URL: `https://api.splus.ir/bot<token>/METHOD_NAME` (pyconnection README shows `GET https://api.splus.ir/bot<token>/getMe` and `POST …/sendMessage` with JSON).
- `[THIRD-PARTY]` Webhook ports: 443, 80, 88, 8443.
- `[THIRD-PARTY]` File upload/download limit 20 MB; automatic handling of Flood Control (HTTP 429) with `retry_after` exists in SDKs.
- `[THIRD-PARTY]` Download URL shape: `/file/bot<token>/<path>` (aiosplus README), full host `[NOT VERIFIED]`.
- `[THIRD-PARTY]` Deep links use `https://splus.ir/<bot>?start=<param>` instead of `t.me`.
- Legacy: `[THIRD-PARTY]` an old gist uses `https://bot.splus.ir/{TOKEN}/sendMessage` with `{"type":"TEXT","to":…,"body":…}` and SSE `getMessage` on `/v2/{TOKEN}/getMessage`. This is a **different, older API**; not the one in your link file. Status `[NOT VERIFIED]`.

## 3. Methods
Names from SDK READMEs (martsor, soroushpluslite, aiosplus). **Parameter tables are `[NOT VERIFIED]`** (official page not read). Because the API mirrors Telegram's, the Telegram names are likely, but that is an inference — verify before use.
| Group | Methods |
|---|---|
| Bot | getMe |
| Updates | getUpdates, setWebhook (named in soroushpluslite); martsor lists unspecified "webhook API methods" — deleteWebhook/getWebhookInfo names `[NOT VERIFIED]` |
| Send | sendMessage, sendPhoto, sendDocument, sendVideo, sendAudio, sendVoice, sendAnimation, sendSticker, sendLocation, sendContact, sendMediaGroup |
| Move | forwardMessage, copyMessage |
| Files | getFile (+ download) |
| Edit/delete | editMessageText, editMessageCaption, editMessageMedia, editMessageReplyMarkup, deleteMessage |
| Callbacks | answerCallbackQuery (used in soroushpluslite: `answer_callback_query`) |
| Commands | setMyCommands, getMyCommands, deleteMyCommands (SDK uses `(command, description)` pairs) |
| Chats | getChat (conflicting status) |
| Stickers | sendSticker; getStickerSet marked "coming soon" |
Media inputs accepted by soroushpluslite: `file_id`, HTTPS URL, file-like object, local path.

## 4. Errors `[THIRD-PARTY]`
SDK exception classes: InvalidTokenError, BotBlockedError, RateLimitError (with `retry_after`). Raw error JSON shape `[NOT VERIFIED]`.

## 5. Not known
`[NOT VERIFIED]`: all parameter names/limits (text length, caption length), response envelope, MarkdownV2/HTML details, channel-post permission model, rate limits.

## 6. Sending to a channel — see `channel-messaging.md`.

## 7. References used
- https://soroushplus.com/en/p/documents (official; **blocked — not read**)
- https://github.com/AmirRedox2008/soroushpluslite (fetched; capability matrix, ports, limits, Telegram differences)
- https://pypi.org/project/martsor/ (method list)
- https://pypi.org/project/aiosplus/ (endpoint list, download path)
- https://github.com/SalesmanMNRA/pyconnection (base URL usage)
- https://gist.github.com/alyrezo/e4c8ffe06e863c54d0d9397c4d5672f0 (legacy bot.splus.ir API)
