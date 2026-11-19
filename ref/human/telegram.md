# Telegram Bot API — Plain-Language Guide (Bot API 10.3)

**Sources:** https://core.telegram.org/bots/api and https://core.telegram.org/bots/api-changelog (read 2026-11-16). The API page was cut off in my reader before the method sections, so per-method parameter tables are missing. To finish this, fetch `https://core.telegram.org/bots/api.md` and send it to me.

## What it is **[Verified]**
An HTTP interface for building Telegram bots. It's the largest of the five: messaging, media, buttons, inline mode, polls, payments (including Stars), stickers, group/channel management, forum topics, reactions, business accounts, Mini Apps, rich messages, and much more. Version 10.3 came out 2026-08-24.

## What you need **[Verified]**
A bot token from @BotFather. Send HTTPS requests to `https://api.telegram.org/bot<token>/METHOD_NAME` using GET or POST. Parameters can go in the URL, as a form, as JSON, or as multipart (for file upload). Responses are JSON: `ok`, then `result` or `description` + `error_code`.

## Getting messages **[Verified]**
Choose one of two ways (not both): `getUpdates` (polling; `timeout` for long polling, `limit` 1–100) or a webhook (`setWebhook`; ports 443, 80, 88, 8443; optional `secret_token` sent in a header so you know the call is really from Telegram). Updates are kept for 24 hours. Some update types (`chat_member`, `message_reaction`, `message_reaction_count`) must be explicitly requested.

## Local server option **[Verified]**
You can run your own Bot API server (github.com/tdlib/telegram-bot-api) to upload files up to 2000 MB, download without limit, use any webhook port, and use plain HTTP webhooks.

## Methods
I can only list names that appear in the official changelog; their parameters are **[Not verified]**. Highlights: `sendMessage`, `sendPhoto`, `sendVideo`, `sendDocument`, `sendPoll`, `sendMediaGroup`, `forwardMessage`, `copyMessage`, `editMessageText`, `deleteMessage(s)`, `setMessageReaction`, `promoteChatMember`, `pinChatMessage`, forum-topic methods, sticker methods, payment/Stars methods, business-account methods, `sendRichMessage`, `sendMessageDraft`. The complete name list is in `../agent/telegram.md` §7.

Older classic methods such as `banChatMember` or `answerCallbackQuery` probably exist but I did not read them in the official page. **[Not verified]**

**Sources:** https://core.telegram.org/bots/api · https://core.telegram.org/bots/api-changelog
