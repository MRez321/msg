# Soroush Plus Bot API — Plain-Language Guide

**Important:** the official docs (https://soroushplus.com/en/p/documents) block automated readers. Everything here is **[Third-party]** (mostly the `soroushpluslite` library, which says it checked the official docs; I could not confirm that) or **[Not verified]**.

## What it is
A Telegram-style bot API for Soroush Plus, but smaller. According to the library: no inline mode, no polls, no payments, no group-admin methods.

## What you need
- A token from https://splus.ir/botfather.
- Base URL: `https://api.splus.ir/bot<token>/METHOD_NAME`.
- Webhooks accept ports 443, 80, 88 and 8443. Files are limited to 20 MB.

## What it can do **[Third-party]**
Send text, photos, documents, video, audio, voice, animations, stickers, locations, contacts and albums. Forward and copy. Edit text, caption, media and buttons. Delete. Inline buttons (link or callback only), reply keyboards, force-reply. A command menu (`setMyCommands`). Updates by polling or webhook.

## Things that conflict or are unknown
- `getChat`, pin/unpin, `sendChatAction`, `getStickerSet`: one library says "coming soon" in Soroush's docs, another lists `getChat` as supported. **[Not verified]**
- Parameter names, limits, error format, channel posting rules: **[Not verified]**.
- An older API at `bot.splus.ir` exists in a GitHub gist; it's a different design, not what you linked. **[Not verified]**

Full table: `../agent/soroush-plus.md`.

**Sources:** https://soroushplus.com/en/p/documents (not readable) · https://github.com/AmirRedox2008/soroushpluslite · https://pypi.org/project/martsor/ · https://pypi.org/project/aiosplus/ · https://github.com/SalesmanMNRA/pyconnection
