# Eitaa (EitaaYar) Bot API — Agent Reference

> Audience: coding agents. Written 2026-11-16.
> **IMPORTANT:** the official docs (https://developer.eitaa.com) block automated access (robots.txt). Nothing below was read from the official page. Every fact is `[THIRD-PARTY]` (SDK READMEs on PyPI/GitHub/Packagist) or `[NOT VERIFIED]`.
> Tags: `[THIRD-PARTY]` = from SDK/README; `[NOT VERIFIED]` = unconfirmed; `[USER-PROVIDED]` = from the user's own link file.

## 1. What this API is capable of
`[THIRD-PARTY]` EitaaYar is a **send-oriented** API for posting to Eitaa channels and super-groups: send text, send files (documents, photos, GIFs, stickers via file extension tricks), get bot info.
`[THIRD-PARTY]` (iran-messenger-bot README) No inline keyboards, no message editing, no deletion, no callbacks, no webhooks. Treat as one-way broadcasting. `[NOT VERIFIED]` against official docs.

## 2. What it needs to work
- `[THIRD-PARTY]` An account on https://eitaayar.ir; the **API token** is obtained in the account's "API" section (PyEitaa README). Token example shape: `bot16344:6d3e4430-****-****-****-************` (eitaaphplib README).
- `[THIRD-PARTY]` To post to channels/super-groups you must register the bot **@Sender** there (PyEitaa README: "register the bot (@Sender) for super-groups and channels" in the eitaayar API part).
- `[THIRD-PARTY]` `chat_id`: the channel's numeric id from eitaayar.ir, or the channel username **without `@`** (pyeitaa README examples: `"eitaayar"`, `"1404"`; eitaa-pykit: channel id; for a group the group invite link).

## 3. Base URL — CONFLICT
- `[USER-PROVIDED]` `https://eitaayar.ir/api/app/sendMessage`
- `[THIRD-PARTY]` `https://eitaayar.ir/api/{token}/{method}` (iran-messenger-bot README).
Which is right is `[NOT VERIFIED]`. The user's file shows `app` where the token-shaped segment would be; possibly the token is sent as a parameter in that form. Test both before coding against either.

## 4. Methods
All `[THIRD-PARTY]`; HTTP verb and response JSON shape `[NOT VERIFIED]`.
### getMe
Returns bot information (Pyeitaa `get_me()`, EitaaAPI `GetMe`, PHP/others).
### sendMessage
| Param | Req | Meaning (per SDK docs) |
|---|---|---|
| chat_id | yes | channel/group id or username without `@` |
| text | yes | message content |
| title | no | internal title for search/display (Pyeitaa). EitaaAPI SDK prepends `Title: …` to the text itself |
| disable_notification | no | send silently |
| reply_to_message_id | no | send as reply |
| date | no | Unix timestamp for scheduled sending |
| pin | no | pin the message after sending |
| viewCountForDelete | no | delete the message after it reaches this view count |
### sendFile
| Param | Req | Meaning |
|---|---|---|
| chat_id | yes | as above |
| file | yes | the file uploaded (multipart) |
| caption | no | caption text |
Other params (pin, viewCountForDelete, notification) accepted by SDKs for files too: `[THIRD-PARTY]` eitaa-pykit documents `pin` and `view_delete` for files; others `[NOT VERIFIED]`.
Tricks (Pyeitaa README): to send a GIF rename extension to `.gif` (e.g. `.mp4` → `.gif`); to send a sticker rename to `.webp`. `.mp4` files accepted as GIF in PyEitaa. SDKs expose `sendPhoto`, `sendGif`, `sendSticker` as wrappers over sendFile; `sendPhoto` and `sendFile` "are exactly the same" (PyEitaa).
### Channel info (not a Bot API method)
eitaa-pykit `get_info(channel_id)` returns name, image_url, subscriber count, description — implemented by the SDK, mechanism `[NOT VERIFIED]`.

## 5. Not available / unknown
- `[THIRD-PARTY]` No webhooks/inline/edit/delete/callbacks.
- `[NOT VERIFIED]` Rate limits, max file size, max text length, formatting/markdown support, error codes, getUpdates-style receiving.

## 6. Sending to a channel — see `channel-messaging.md`.

## 7. References used
- https://developer.eitaa.com (official; **blocked to automated access — not read**)
- https://eitaayar.ir/api/app/sendMessage (from user's file; not fetched)
- https://pypi.org/project/pyeitaa/ (send_message params, file tricks)
- https://github.com/ADanayi/PyEitaa (token + @Sender registration, sendFile/Photo/Gif/Sticker)
- https://github.com/sirdadfar/iran-messenger-bot (base URL `{token}/{method}`, send-oriented limits)
- https://pypi.org/project/eitaa-pykit/1.1/ and /1.2/ (pin, view_delete, chat_id for channel/group)
- https://github.com/mohammadali-arjomand/eitaaphplib (token shape)
- https://github.com/ProgrammEverything/EitaaAPI and https://pypi.org/project/EitaaAPI/ (GetMe, title behavior)
- https://packagist.org/packages/usermp/eitaayar (sendMessage/sendDocument)
