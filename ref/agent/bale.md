# Bale Bot API — Agent Reference

> Audience: coding agents. Written 2026-11-16.
> Evidence tags used on every claim group:
> - `[VERIFIED-OFFICIAL]` = read directly from https://docs.bale.ai on 2026-11-16
> - `[THIRD-PARTY]` = from SDK/README, not official
> - `[NOT VERIFIED]` = could not be confirmed; do not rely on it

## 1. What this API is capable of
`[VERIFIED-OFFICIAL]` An HTTP bot API for the Bale messenger, modelled on the Telegram Bot API. Capabilities documented:
- Send: text, photo, audio (mp3/m4a), document, video (MPEG4), animation, voice, media group (album), location, contact, invoice (payment request).
- Forward and copy messages; edit message text; delete messages.
- Receive updates by long polling (`getUpdates`) or webhook (`setWebhook`).
- Inline keyboards (`url`, `callback_data` buttons) and reply keyboards (`request_contact`, `request_location`).
- Chat management: ban/unban, promote, set photo/title/description, delete photo, leave, get chat, member count, pin/unpin, invite links.
- Stickers: upload file, create sticker set, add sticker to set.
- Download files up to 20 MB (`getFile`).

## 2. What it needs to work
- `[VERIFIED-OFFICIAL]` A bot created by chatting with `@botfather` inside Bale. Creation gives a unique token shaped like `123456:ABC-DEF1234ghIkl-zyx68W2v1u123ew12`.
- `[VERIFIED-OFFICIAL]` HTTPS only. Base URL: `https://tapi.bale.ai/bot<token>/METHOD_NAME`
- `[VERIFIED-OFFICIAL]` UTF-8 for all requests. Method names are case-insensitive.
- `[VERIFIED-OFFICIAL]` Admin rights for the bot are required for management methods (ban, unban, promote, set photo, pin, etc.).

## 3. Request format
`[VERIFIED-OFFICIAL]`
- HTTP methods: GET and POST.
- Parameters can be sent four ways: URL query string; `application/x-www-form-urlencoded`; `application/json` (not for file upload); `multipart/form-data` (for file upload).
- When answering a webhook, you may reply with a Bot API call: pass the method name in a `method` parameter (content types: json, urlencoded, multipart). You cannot know whether such a call succeeded or get its result.

## 4. Response format
`[VERIFIED-OFFICIAL]` JSON object. Always has boolean `ok`. If `ok=true`, result is in `result`. If `ok=false`, human-readable `description` explains the error; integer `error_code` is also present (value may change in future). Some errors carry optional `parameters` (type `ResponseParameters`) to help automatic handling.
`[NOT VERIFIED]` The fields inside `ResponseParameters` — the type is named but its fields were not on the fetched page.

## 5. Receiving updates
`[VERIFIED-OFFICIAL]`
- Two mutually-exclusive ways: `getUpdates` or webhook. Updates are stored until the bot fetches them; currently the **last 2000 updates are kept for 24 hours**.
- `Update` object: at most one optional field is set. Fields: `update_id` (starts at zero, increments), `message`, `edited_message`, `callback_query`.
- `getUpdates`: `offset` (Integer, optional; must be highest previous `update_id` + 1; negative offset reads from end of queue and forgets earlier ones), `limit` (Integer 1–100, default 100). Recompute offset after each response to avoid duplicates.
- `setWebhook`: `url` (string, required; HTTPS; empty string removes webhook). Supported ports: **443, 88**. Server sends HTTPS POST with a JSON `Update`.
- `getWebhookInfo`: no params; returns `WebhookInfo` (documented field: `url`, empty if no webhook / using getUpdates).
- `[NOT VERIFIED]` `timeout` / `allowed_updates` / `secret_token` parameters: **not documented** on the Bale page (they exist on Telegram). Do not assume them.

## 6. Sending files
`[VERIFIED-OFFICIAL]` Three ways (photos, stickers, audio, media, etc.):
1. By `file_id` already on Bale servers — recommended, no limit.
2. By HTTP URL — Bale downloads it. Max **5 MB for images, 20 MB for other content**.
3. By `multipart/form-data` POST. Max **10 MB for images, 50 MB for other files**.

Rules for `file_id`: cannot change file type on resend (video cannot become photo; photo cannot become document); thumbnails cannot be resent; resending a photo sends all its sizes; `file_id` is unique per bot and cannot be transferred between bots; one file may have several valid `file_id`s.
Rules for URL: correct MIME type required (e.g. `audio/mpeg` for sendAudio); `sendDocument` by URL works only for GIF, PDF, ZIP; `sendVoice` must be `audio/ogg` and ≤ 1 MB (1–20 MB voice is sent as a file); other combinations "should work, no guarantee".
Attaching in `InputMedia`: `media` may be `file_id`, an HTTP URL, or `attach://<file_attach_name>` referencing a multipart part.

## 7. Methods (all `[VERIFIED-OFFICIAL]`)
R = required, O = optional (as shown in docs; where the docs leave the column blank it is marked `(unspecified)`).

### Bot / session
| Method | Params | Returns / notes |
|---|---|---|
| getMe | none | `User`. Tests token. |
| logout | none | True. Log out from cloud Bot API server before running bot in a test environment; afterwards cannot log in to cloud for 10 minutes. |
| close | none | Close bot before moving from local/test server; delete webhook first. |

### Sending
| Method | Params | Notes |
|---|---|---|
| sendMessage | chat_id R (String/Integer; or `@channelusername`), text R (1–4096 chars), reply_to_message_id (unspecified), reply_markup (InlineKeyboardMarkup / ReplyKeyboardMarkup / ReplyKeyboardRemove) | Returns sent `Message`. |
| forwardMessage | chat_id R, from_chat_id R, message_id R | Returns Message. |
| copyMessage | chat_id R, from_chat_id R, message_id R | Like forward but no link to original; service messages and payment receipts cannot be copied. Returns `MessageId`. |
| sendPhoto | chat_id R, photo R (InputFile/String), caption O (0–1024), reply_to_message_id O, reply_markup O | Docs table also prints `from_chat_id` (R) — appears to be a doc error, see §10. |
| sendAudio | chat_id R, audio R, caption O (0–1024), reply_to_message_id O, reply_markup O | Must be .MP3 or .M4A, up to 50 MB (may change). For voice use sendVoice. |
| sendDocument | chat_id R, document R, caption O (0–1024), reply_to_message_id O, reply_markup O | Any file type, up to 50 MB (may change). |
| sendVideo | chat_id R, video R, caption O (0–1024), reply_to_message_id O, reply_markup O | MPEG4 supported (others as Document). Up to 50 MB. |
| sendAnimation | chat_id R, animation R, reply_to_message_id O, reply_markup O | GIF or H.264/MPEG-4 AVC without sound. Up to 50 MB. |
| sendVoice | chat_id R, voice R, caption O (0–1024), reply_to_message_id O, reply_markup O | Shown as voice message. Up to 50 MB. |
| sendMediaGroup | chat_id R, media R (array of InputMediaAudio/Document/Photo/Video), reply_to_message_id O | Album. Documents and audio can only be grouped with their own kind. Returns array of Messages. |
| sendLocation | chat_id R, latitude R (Float), longitude R (Float), horizontal_accuracy O (0–1500 m), reply_to_message_id O, reply_markup O | |
| sendContact | chat_id R, phone_number R, first_name R, last_name O, reply_to_message_id O, reply_markup O | Docs print types of these three as `Integer` — likely a doc error; send strings. `[NOT VERIFIED]` |
| sendInvoice | chat_id R, title R (1–32), description R (1–255), payload R (1–128 bytes, hidden from user, returned in SuccessfulPayment), provider_token R (docs: "card number behind the money request"), prices R (array of LabeledPrice; sum = total), photo_url O, reply_to_message_id O, reply_markup O (InlineKeyboardMarkup) | Payment request. |

### Files
| Method | Params | Notes |
|---|---|---|
| getFile | file_id R | Returns `File`. Download at `https://tapi.bale.ai/file/bot<token>/<file_path>`. Max 20 MB; link valid 1 hour, call again for a new one. |

### Editing / deleting
| Method | Params | Notes |
|---|---|---|
| editMessageText | chat_id O, message_id O (both required unless inline_message_id is used), text R (1–4096), reply_markup O (InlineKeyboardMarkup) | Docs state: currently only messages **without** reply_markup/inline keyboards can be edited. |
| deleteMessage | chat_id R, message_id R | Only if sent < 48 h ago. Bot can delete own outgoing messages in private chats and groups; incoming in private chats; any message if bot is group admin; any message in a channel if bot has `can_delete_messages`. Returns True. |

### Chat management (bot must be admin with matching right)
| Method | Params |
|---|---|
| banChatMember | chat_id R, user_id R (user cannot rejoin via invite link until unbanned) |
| unbanChatMember | chat_id R, user_id R, only_if_banned O (Boolean) |
| promoteChatMember | chat_id R, user_id R, can_change_info O, can_post_messages O, can_edit_messages O, can_delete_messages O, can_manage_video_chats O, can_invite_users O, can_restrict_members O (all Boolean; set all False to demote) |
| setChatPhoto | chat_id R, photo R (InputFile, multipart). Not for private chats. |
| deleteChatPhoto | chat_id R |
| setChatTitle | chat_id R, title R |
| setChatDescription | chat_id R, description R |
| leaveChat | chat_id R |
| getChat | chat_id R → `Chat` |
| getChatMembersCount | chat_id R → Integer |
| pinChatMessage | chat_id R, message_id R (non-private chats: bot must be admin with `can_pin_messages`) |
| unPinChatMessage | chat_id R, message_id R (same rule) |
| unpinAllChatMessages | chat_id R (same rule) |
| createChatInviteLink | chat_id R |
| revokeChatInviteLink | chat_id R, invite_link R (new link is created and returned) |
| exportChatInviteLink | chat_id R (creates new link; revokes previous) |

### Stickers
| Method | Params |
|---|---|
| uploadStickerFile | user_id R, sticker R (InputFile .WEBP/.PNG/.TGS/.WEBM) |
| createNewStickerSet | user_id R, name R (1–64; letters/digits/underscore; starts with letter; no double underscore; must end in `_by_<bot_username>`), title R (1–64), sticker R (array of InputSticker, 1–50) |
| addStickerToSet | user_id R, name R, sticker R (InputSticker). Limits: emoji sets 200, video sets 50, regular sets 120. |
`[NOT VERIFIED]` There is **no sendSticker method** on the fetched page even though a `Sticker` type exists.

### Not on the fetched page
`[NOT VERIFIED]` The fetched page **ended at `sendInvoice`**. Methods that may follow (e.g. answering callback queries, pre-checkout answers) could not be read. Do not assume they exist or do not exist.

## 8. Formatting text
`[VERIFIED-OFFICIAL]` No `parse_mode` parameter is documented. Bale documents inline markers inside `text`:
- Bold: wrap in two asterisks; a space is needed before the first and after the second.
- Italic: wrap in two underscores; same spacing rule.
- Link: `[text](url)` with no space between `]` and `(`.
- "Instant display" (نمایش آنی): put text in brackets and the extra explanation between triple backticks: `` ```[text]description``` ``.

## 9. Types (`[VERIFIED-OFFICIAL]`, fields as listed)
- `User`: id, is_bot, first_name, last_name?, username?, language_code?
- `Chat`: id, type (`private` | `group` | `channel`), title?, username?, first_name?, last_name?, photo? (only from getChat)
- `Message`: message_id, from?, date, chat, forward_from?, forward_from_chat?, forward_from_message_id?, forward_date?, reply_to_message?, edite_date? (spelled so in docs), text?, animation?, audio?, document?, photo?, sticker?, video?, voice?, caption?, contact?, location?, new_chat_members?, left_chat_member?, invoice?, successful_payment?, reply_markup?. For channel posts `from` is empty.
- `MessageId`: message_id
- `PhotoSize`: file_id, file_unique_id, width, height, file_size?
- `Animation`: file_id, file_unique_id, width, height, duration, thumbnail?, file_name?, mime_type?, file_size?
- `Audio`: file_id, file_unique_id, duration, title?, file_name?, mime_type?, file_size?
- `Document`: file_id, file_unique_id, thumbnail?, file_name?, mime_type?, file_size?
- `Video`: file_id, file_unique_id, width, height, duration, file_name?, mime_type?, file_size?
- `Voice`: file_id, file_unique_id
- `Contact`: phone_number, first_name, last_name?, user_id?
- `Location`: longitude, latitude
- `File`: file_id, file_unique_id, file_size?, file_path?
- `ReplyKeyboardMarkup`: keyboard (array of arrays of KeyboardButton)
- `KeyboardButton`: text, request_contact? (Boolean), request_location? (Boolean; web version)
- `InlineKeyboardButton` (use only one optional field): text, url?, callback_data? (1–64 bytes)
- `CallbackQuery`: id, from, message?, data?  (docs also mention `inline_message_id`)
- `ChatPhoto`: small_file_id, small_file_unique_id (160×160), big_file_id, big_file_unique_id (640×640)
- `InputMedia*` (Photo/Video/Animation/Audio/Document): `type`, `media`, `caption` (0–1024); Video/Animation add thumbnail (JPEG ≤200 KB, ≤320×320), width, height, duration; Audio adds thumbnail, duration, title.
- `Sticker`: file_id, file_unique_id, type (`regular` | `mask`), width, height, file_size?
- `StickerSet`: name, title, stickers[], thumbnail?
`[NOT VERIFIED]` Full definitions of `InlineKeyboardMarkup`, `ReplyKeyboardRemove`, `LabeledPrice`, `InputSticker`, `Invoice`, `SuccessfulPayment`, `WebhookInfo` beyond `url`, `ResponseParameters` — referenced but not defined in the fetched text.

## 10. Known documentation inconsistencies
- sendPhoto table lists `from_chat_id` as required — appears copy-pasted from forwardMessage.
- sendContact lists phone_number/first_name/last_name as `Integer`.
- `Message.edite_date` spelling.
- Intro says `Update` has 3 fields, getUpdates stored count says last 2000 for 24 h.

## 11. Sending to a channel — see `channel-messaging.md`.

## 12. References used
- https://docs.bale.ai (fetched 2026-11-16; page cut off at `sendInvoice`)
