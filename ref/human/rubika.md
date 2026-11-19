# Rubika Bot API (v3) — Plain-Language Guide

**Sources:** https://rubika.ir/botapi/methods (read fully) and snippets of https://rubika.ir/botapi and https://rubika.ir/botapi/models. Marks as in the README.

## What it is
A bot API for Rubika. It looks different from Telegram, so don't assume Telegram code will work.

## What you need
- A bot token. **[Not verified]** how you get one; the pages I read don't say.
- Every call is `POST https://botapi.rubika.ir/v3/{token}/{method}` with a JSON body. **[Verified]**
- Chat ids are strings. **[Third-party]** they look like GUIDs: `u0…` user, `g0…` group, `c0…` channel, `b0…` bot.

## What the bot can do **[Verified]**
- Get its own info (`getMe`) and chat info (`getChat`).
- Send text, polls, locations, contacts and files. Forward, edit text, edit keypads and delete messages.
- Set a list of commands (`setCommands`).
- Show buttons: **inline keypad** (under the message) or **chat keypad** (bottom of the chat). Remove or replace the chat keypad with `editChatKeypad`.
- Receive updates by polling (`getUpdates`) or by Rubika posting to your URL, which you register with `updateBotEndpoints`.

## Sending a file (3 steps)
1. Call `requestSendFile` with the type (`File` up to 50 MB, `Image` up to 10 MB, `Voice`, `Music`). You get an `upload_url`.
2. Upload the file to that URL as multipart field `file`. You get a `file_id`.
3. Call `sendFile` with the `chat_id` and `file_id`.

## What an incoming message looks like **[Verified]**
Rubika sends `{"update": {"type": "NewMessage", "chat_id": …, "new_message": {message_id, text, time, is_edited, sender_type, sender_id, aux_data{start_id, button_id}}}}`. When a user taps a button, its id arrives in `aux_data.button_id`.

## Watch out for
- The docs have mistakes: `frowardMessage` (typo for `forwardMessage`), and the keypad-edit example uses two different paths. **[Not verified]** which one the server accepts.
- **[Not verified]**: rate limits, error format, full list of update types and button types.
- **[Third-party]** responses are shaped like `{"status":"OK","data":{…}}`.

Full tables: `../agent/rubika.md`.

**Sources:** https://rubika.ir/botapi/methods · https://rubika.ir/botapi · https://rubika.ir/botapi/models
