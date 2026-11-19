# Messenger Bot APIs — Your Reading Guide

Written 2026-11-16. This is the human version. The version written for coding agents is in `../agent`.

## How to read the marks
- **[Verified]** I read it in the official documentation.
- **[Third-party]** It comes from a library or tutorial someone else wrote, not from the official docs.
- **[Not verified]** I could not confirm it. Test before you rely on it.

## How complete is each file?
| Messenger | Did I read the official docs? | What's missing |
|---|---|---|
| Bale | Yes | The page stopped at `sendInvoice`; anything after it is unknown |
| Rubika | Methods page: yes | Full list of data fields and enum values |
| Telegram | Partly (page was cut off) | Per-method parameter tables |
| Soroush+ | No, the site blocks bots | Almost everything is third-party |
| Eitaa | No, the site blocks bots | Almost everything is third-party; base URL conflict |

## The messengers in one paragraph each
- **Bale** ([bale.md](bale.md)): the closest to Telegram. Bots send text, files, media, payments and stickers, manage groups, and can use polling or webhooks.
- **Eitaa** ([eitaa.md](eitaa.md)): mainly a way to *post* into channels and groups. Per third-party sources it has no editing, buttons or webhooks.
- **Rubika** ([rubika.md](rubika.md)): looks different from Telegram. Everything is a JSON POST, chat ids are GUIDs, buttons are called "keypads", and file upload takes three steps.
- **Soroush+** ([soroush-plus.md](soroush-plus.md)): copies Telegram's style but offers less (no polls, payments or inline mode, according to a third-party library).
- **Telegram** ([telegram.md](telegram.md)): the original and the largest. The current version is Bot API 10.3.
- **Telegram through Cloudflare** ([../relay/telegram-cloudflare-relay.md](../relay/telegram-cloudflare-relay.md)): a relay that passes every Telegram feature, with the ready-to-deploy `../relay/worker.js`.
- **Sending to channels** ([channel-messaging.md](channel-messaging.md)): one guide that covers all five.

## Official links you gave me
Bale https://docs.bale.ai · Eitaa https://developer.eitaa.com · Rubika https://rubika.ir/botapi · Soroush+ https://soroushplus.com/en/p/documents · Telegram https://core.telegram.org/bots/api
