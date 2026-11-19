# Rubika Bot API (v3) — Agent Reference

> Audience: coding agents. Written 2026-11-16.
> Evidence tags:
> - `[VERIFIED-OFFICIAL]` = read from https://rubika.ir/botapi/methods (official, fetched 2026-11-16) or official snippets of https://rubika.ir/botapi and https://rubika.ir/botapi/models returned by search
> - `[THIRD-PARTY]` = from SDK/README, not official
> - `[NOT VERIFIED]` = could not be confirmed

## 1. What this API is capable of
`[VERIFIED-OFFICIAL]` Methods documented: getMe, sendMessage (text / chat keypad / inline keypad), sendPoll, sendLocation, sendContact, getChat, getUpdates, forwardMessage, editMessageText, editMessageKeypad (see §9 inconsistency), deleteMessage, setCommands, updateBotEndpoints, editChatKeypad (New / Remove), getFile, sendFile, requestSendFile (upload). Receiving updates via polling (`getUpdates`) and via POST to your endpoint (`receiveUpdate`).
It is **not Telegram-compatible**: different URL shape, JSON-only bodies, different method set, GUID-style chat ids, keypads instead of reply/inline markup classes.

## 2. What it needs to work
- `[VERIFIED-OFFICIAL]` A bot token. Endpoint shape: `https://botapi.rubika.ir/v3/{token}/{method}`.
- `[VERIFIED-OFFICIAL]` Every documented example is an HTTP **POST** (even `getMe`) with `Content-Type: application/json` and a JSON body.
- `[NOT VERIFIED]` How the token is obtained (the fetched pages do not say). `[THIRD-PARTY]` Rubika bots are made via Rubika's bot-creation bot (not confirmed by official pages I could read).
- `[NOT VERIFIED]` Rate limits, error codes, whether GET is accepted.

## 3. Response format
`[THIRD-PARTY]` (reza-em/lumeh-shop-telegram-bale-rubika-bot README) replies look like `{"status":"OK","data":{…}}`. The official methods page lists only the fields inside `data` (e.g. `message_id`). Treat the envelope as `[THIRD-PARTY]`; `[NOT VERIFIED]` for error shape.

## 4. Chat identifiers
`[VERIFIED-OFFICIAL]` `chat_id` is a string ("شناسه چت").
`[THIRD-PARTY]` SDK examples show GUID prefixes: `u0…` (user), `g0…` (group), `c0…` (channel, e.g. `c0xABCDEF...`), `b0…` (bot). Not stated on the official pages I read.

## 5. Receiving updates
### Polling — `getUpdates` `[VERIFIED-OFFICIAL]`
Input: `offset_id` (str; pass previous `next_offset_id` to continue), `limit` (int). Output: `updates` (list[Update]), `next_offset_id` (str).
`[THIRD-PARTY]` No long-poll timeout parameter exists; adapters poll every ~1.5 s.
### Push — `receiveUpdate` `[VERIFIED-OFFICIAL]`
Whenever a user sends a message or taps ChatKeypad buttons, you receive a POST whose body contains an `Update`. Official sample:
```json
{
  "update": {
    "type": "NewMessage",
    "chat_id": "{chat_id}",
    "new_message": {
      "message_id": "{message_id}",
      "text": "custom text",
      "time": "1643122902",
      "is_edited": false,
      "sender_type": "User",
      "sender_id": "{sender_id}",
      "aux_data": { "start_id": null, "button_id": "{button_id}" }
    }
  }
}
```
Endpoints are registered with `updateBotEndpoints` (§6).
### Update types `[VERIFIED-OFFICIAL]` (partial enum from models page snippet)
`NewMessage`, `StartedBot`, `StoppedBot`. `[THIRD-PARTY]` also an `inline_message` update type (seen in an adapter README). `[NOT VERIFIED]` the complete `UpdateTypeEnum` (the model page says "new message, edited message, deleted message…" in prose).

## 6. Methods (all `[VERIFIED-OFFICIAL]`; base `POST https://botapi.rubika.ir/v3/{token}/{method}`, JSON)
| Method | Input (type) | Output |
|---|---|---|
| getMe | none | `bot: Bot` |
| sendMessage | chat_id (str), text (str), chat_keypad (Keypad), disable_notification (bool, default false), inline_keypad (Keypad), reply_to_message_id (str), chat_keypad_type (ChatKeypadTypeEnum) | `message_id` (str) |
| sendPoll | chat_id, question (str), options (list[str]) | `message_id` |
| sendLocation | chat_id, latitude (str), longitude (str), chat_keypad, disable_notification (str), inline_keypad, reply_to_message_id, chat_keypad_type | `message_id` |
| sendContact | chat_id, first_name, last_name, phone_number (all str), chat_keypad, disable_notification (str), inline_keypad, reply_to_message_id, chat_keypad_type | `message_id` |
| getChat | chat_id | `chat: Chat` |
| getUpdates | offset_id (str), limit (int) | `updates`, `next_offset_id` |
| forwardMessage | from_chat_id, message_id, to_chat_id, disable_notification (bool) | `new_message_id` |
| editMessageText | chat_id, message_id, text | (no output documented) |
| editMessageKeypad | chat_id, message_id, inline_keypad | (no output documented) |
| deleteMessage | chat_id, message_id | (no output documented). Doc text: deletes bot's own messages, or others' if permitted. |
| setCommands | bot_commands (list[BotCommand]; each `{command, description}`) | — |
| updateBotEndpoints | url (str), type (UpdateEndpointTypeEnum; doc example `"GetSelectionItem"`) | — |
| editChatKeypad | chat_id, chat_keypad_type (`Remove` to delete keypad / `New` to replace), chat_keypad (Keypad; for `New`) | — |
| getFile | file_id (str) | `download_url` (str) |
| sendFile | chat_id, file_id, text, reply_to_message_id, disable_notification (str), chat_keypad, inline_keypad, chat_keypad_type | `message_id` |
| requestSendFile | type (FileTypeEnum) | `upload_url` (str) |

### File upload flow `[VERIFIED-OFFICIAL]`
1. `POST /requestSendFile` with `{"type":"Image"}` → `upload_url`.
2. `POST` the file to `upload_url` as `multipart/form-data`, field `file` → returns `file_id`.
3. `POST /sendFile` with `chat_id` + `file_id` (+ optional `text` caption, keypads).
`FileTypeEnum` `[VERIFIED-OFFICIAL]`: `File` (general, max 50 MB), `Image` (jpg/gif/png/webp, max 10 MB), `Voice` (short mp3 voice message), `Music` (mp3 song).

## 7. Keypads `[VERIFIED-OFFICIAL — from examples]`
Structure:
```json
{"rows":[{"buttons":[{"id":"100","type":"Simple","button_text":"Add Account"}]}],
 "resize_keyboard": true, "on_time_keyboard": false}
```
- `inline_keypad` = buttons under the message. `chat_keypad` = buttons at the bottom of the chat; send with `chat_keypad_type: "New"`; remove with `editChatKeypad` + `"Remove"`.
- `resize_keyboard` and `on_time_keyboard` (spelled so in docs) appear in the chat-keypad examples.
- `ChatKeypadTypeEnum`: `New` (add keypad), `Remove` (delete keypad).
- Button callbacks arrive as `aux_data.button_id` in the update.
`[THIRD-PARTY]` Other button types seen in SDKs: ASK_MY_LOCATION, ASK_MY_PHONE_NUMBER. `[NOT VERIFIED]` official `ButtonTypeEnum` values and `Keypad` field list beyond the above.

## 8. Models (`[VERIFIED-OFFICIAL]` partial, from models page snippet)
- `Update`: type (UpdateTypeEnum), new_message (Message).
- `MessageKeypadUpdate`: message_id, inline_keypad.
- Enums named on the page: ButtonTextboxTypeKeypadEnum, ButtonTextboxTypeLineEnum, ButtonLocationTypeEnum, MessageSenderEnum, UpdateTypeEnum, ChatKeypadTypeEnum, UpdateEndpointTypeEnum, MetadataTypeEnum, EnumChatAccess, EventTypeEnum, EventJoinTypeEnum.
- Message fields seen in the official webhook sample: message_id, text, time, is_edited, sender_type, sender_id, aux_data{start_id, button_id}.
`[NOT VERIFIED]` Values of every enum except FileTypeEnum / ChatKeypadTypeEnum; full `Message`, `Chat`, `Bot`, `File` field lists.

## 9. Documentation inconsistencies (do not copy blindly)
- forwardMessage Python/Node samples call `frowardMessage` (typo); method name is `forwardMessage`.
- "editMessageKeypad" curl sample hits `/editInlineKeypad`; Python/Node samples hit `/editMessageText`. Which path the server accepts for keypad edits is `[NOT VERIFIED]`.
- sendLocation/sendContact/sendFile list `disable_notification` as `str`, others as `bool`.
- `sendFile` Python sample imports `sendFile` and calls `send_sticker` (SDK sample error).

## 10. Sending to a channel — see `channel-messaging.md`.

## 11. References used
- https://rubika.ir/botapi/methods (fetched in full, 2026-11-16)
- https://rubika.ir/botapi (search snippet: receiveUpdate sample)
- https://rubika.ir/botapi/models (search snippet: enums/models; page blocked to fetch)
- https://github.com/reza-em/lumeh-shop-telegram-bale-rubika-bot (third-party: response envelope, polling behavior)
- https://pypi.org/project/rubka/ , https://pypi.org/project/robobot-rubika/ , https://pypi.org/project/rubio/ (third-party SDKs: GUID prefixes, button types)
