# Bale Bot API — Plain-Language Guide

**Source:** https://docs.bale.ai (read 2026-11-16). Everything here is **[Verified]** unless marked. The page ended at `sendInvoice`.

## What it is
A web (HTTP) API that lets a program act as a bot in Bale. It follows the Telegram Bot API closely.

## What you need
1. Create the bot by chatting with `@botfather` in Bale. You get a token like `123456:ABC-DEF...`.
2. Send HTTPS requests to `https://tapi.bale.ai/bot<token>/METHOD_NAME`.
3. Make the bot an admin of any chat where you want it to manage things.

## How requests work
You can use GET or POST. Parameters can go in the URL, as a form, as JSON, or as multipart (multipart is needed for file upload). Every answer is JSON with `ok` (true/false). If true, the data is in `result`; if false, `description` explains and `error_code` gives a number.

## What the bot can do
- **Send:** text (up to 4096 characters), photos, audio (mp3/m4a), documents, video (mp4), animations, voice, albums, locations, contacts, and payment requests.
- **Move messages:** forward, copy, edit text, delete (only within 48 hours).
- **Receive messages:** by polling (`getUpdates`) or webhook (`setWebhook`, ports 443 and 88). Bale keeps the last 2000 updates for 24 hours.
- **Buttons:** inline buttons (link or callback data up to 64 bytes) and reply keyboards (can ask for contact or location).
- **Manage chats:** ban/unban, promote, change photo/title/description, pin messages, invite links, leave, count members.
- **Stickers:** upload a file, create a set, add to a set.
- **Download files** up to 20 MB through `getFile` (link lasts one hour).

## File sending rules
Three ways: reuse a `file_id` (no limit), give a URL (5 MB for images, 20 MB others), or upload directly (10 MB images, 50 MB others). A `file_id` only works for the bot that received it, and you cannot change a file's type when resending.

## Text formatting
There's no `parse_mode`. Instead, wrap text in markers: `*bold*` and `_italic_` (a space is required before and after the markers) and `[text](url)` for links.

## Things to watch out for
- Editing: according to the docs, only messages *without* buttons can be edited right now.
- There is no `sendSticker` on the page I read. **[Not verified]** whether it exists.
- The docs contain apparent typos (sendPhoto lists a `from_chat_id` parameter; sendContact lists names as numbers).
- Anything after `sendInvoice` on the original page was cut off. **[Not verified]**

For the full method-by-method table, open `../agent/bale.md`.

**Sources:** https://docs.bale.ai
