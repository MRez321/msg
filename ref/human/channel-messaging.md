# Sending a Message to a Channel — Plain-Language Guide

Marks: **[Verified]** official docs · **[Third-party]** libraries · **[Not verified]** unconfirmed.

## The idea
On every platform you make one web request to `sendMessage` with two things: **which channel** (`chat_id`) and **what to say** (`text`). The details differ:

| | What you send to | How you identify the channel | The bot must be… |
|---|---|---|---|
| Telegram | `api.telegram.org/bot<token>/sendMessage` | `@channelusername` or numeric id | in the channel with posting rights **[Not verified]** which exact right |
| Bale | `tapi.bale.ai/bot<token>/sendMessage` | `@channelusername` **[Verified]** | in the channel; explicit admin rule **[Not verified]** |
| Rubika | `botapi.rubika.ir/v3/<token>/sendMessage` | a GUID starting `c0` **[Third-party]** | **[Not verified]** |
| Soroush+ | `api.splus.ir/bot<token>/sendMessage` | **[Not verified]** | **[Not verified]** |
| Eitaa | `eitaayar.ir/api/<token>/sendMessage` **[Third-party]** (your file says `/api/app/sendMessage`) | channel id or username without `@` **[Third-party]** | registered with bot **@Sender** **[Third-party]** |

## Example per platform
**Telegram / Bale** (same shape):
```bash
curl -X POST "https://api.telegram.org/bot<token>/sendMessage" \
  -H "Content-Type: application/json" \
  -d '{"chat_id":"@channelusername","text":"Hello channel"}'
```
For Bale swap the URL for `https://tapi.bale.ai/bot<token>/sendMessage`.

**Rubika** (JSON only):
```bash
curl -X POST 'https://botapi.rubika.ir/v3/<token>/sendMessage' \
  -H 'Content-Type: application/json' \
  -d '{"chat_id":"<channel_guid>","text":"Hello channel"}'
```

**Eitaa** (verify the URL and verb first; this is the third-party form):
```bash
curl -X POST "https://eitaayar.ir/api/<token>/sendMessage" \
  -d "chat_id=<channel_id>" -d "text=Hello channel"
```

**Soroush+:** a third-party example shows `POST https://api.splus.ir/bot<token>/sendMessage` with JSON. The exact fields are **[Not verified]**; if it mirrors Telegram, `chat_id` and `text` would be used, but test first.

## Extras
- **Eitaa:** you can schedule (`date`), pin (`pin`), or auto-delete (`viewCountForDelete`) **[Third-party]**.
- **Rubika, Bale, Telegram:** silent send via `disable_notification` (Rubika: verified; Telegram: parameter exists in the API but I did not read its table; Bale: not in the page).
- **Files:** Bale uses `sendPhoto`/`sendDocument` etc. directly. Rubika uses the 3-step upload. Eitaa uses `sendFile`.

## Before you write code
Test each `[Not verified]` item with a throwaway channel. The agent version with more detail is `../agent/channel-messaging.md`.

**Sources:** https://core.telegram.org/bots/api · https://docs.bale.ai · https://rubika.ir/botapi/methods · https://github.com/ADanayi/PyEitaa · https://pypi.org/project/pyeitaa/ · https://github.com/AmirRedox2008/soroushpluslite · https://github.com/SalesmanMNRA/pyconnection
