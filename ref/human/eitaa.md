# Eitaa (EitaaYar) Bot API — Plain-Language Guide

**Important:** the official site (https://developer.eitaa.com) blocks automated readers, so I could not read it. Everything here is **[Third-party]** (libraries on PyPI/GitHub) or **[Not verified]**.

## What it is
A service for *posting* into Eitaa channels and groups from your own program. Libraries describe it as send-focused: no editing, buttons, deletion, callbacks or webhooks. **[Third-party]**

## What you need
1. An account at https://eitaayar.ir; the token is in the account's API section.
2. Add the bot **@Sender** to your channel or super-group.
3. Know the channel id, or the channel username without `@`.

## The base URL problem
Your link file says `https://eitaayar.ir/api/app/sendMessage`. The libraries use `https://eitaayar.ir/api/{token}/{method}`. **[Not verified]** which is correct; test both.

## What you can send **[Third-party]**
- **Text:** `chat_id` and `text` are required. Optional: `title`, `disable_notification`, `reply_to_message_id`, `date` (schedule with a Unix timestamp), `pin`, `viewCountForDelete` (auto-delete when the view count is reached).
- **Files:** `chat_id`, the file, and an optional `caption`. Trick: rename a file to `.gif` to send it as a GIF, or `.webp` to send it as a sticker.
- **Bot info:** `getMe`.

## Unknown **[Not verified]**
HTTP verb (GET/POST), response format, size and length limits, formatting support, rate limits, error codes.

Full table: `../agent/eitaa.md`.

**Sources:** https://developer.eitaa.com (not readable) · https://github.com/ADanayi/PyEitaa · https://pypi.org/project/pyeitaa/ · https://github.com/sirdadfar/iran-messenger-bot · https://pypi.org/project/eitaa-pykit/1.1/
