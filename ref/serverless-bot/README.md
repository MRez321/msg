# Messenger Bot APIs — Master Index (for agents)

Written 2026-11-16. One file per API plus a channel-messaging guide. A human-readable version of the same set is in `../human`.

## Evidence legend (used in every file)
- `[VERIFIED-OFFICIAL]` read directly from the official documentation
- `[THIRD-PARTY]` from SDKs/READMEs, not official
- `[USER-PROVIDED]` from the user's link list
- `[NOT VERIFIED]` could not be confirmed — test before use

## Coverage honesty
| API | Official docs read? | Completeness |
|---|---|---|
| Bale | Yes (docs.bale.ai) | Full until `sendInvoice`; page ended there |
| Rubika | Methods page: yes. Models/intro: snippets only | Methods complete; models partial |
| Telegram | Partially (page truncated; changelog read) | Update/webhook/core types complete; per-method parameters missing |
| Soroush+ | No (blocked) | Third-party only |
| Eitaa | No (blocked) | Third-party only; base URL conflict |

## APIs
| API | Base URL | File | One-line summary |
|---|---|---|---|
| Bale | `https://tapi.bale.ai/bot<token>/METHOD` | [bale.md](bale.md) | Telegram-like, Persian docs, messaging + payments + stickers + chat admin; polling or webhook (ports 443, 88). |
| Eitaa | `https://eitaayar.ir/api/{token}/{method}` (third-party) / `…/api/app/sendMessage` (user file) | [eitaa.md](eitaa.md) | Send-only (EitaaYar): text and files to channels/groups; no editing, callbacks or webhooks (third-party). |
| Rubika | `https://botapi.rubika.ir/v3/{token}/{method}` | [rubika.md](rubika.md) | Not Telegram-compatible; JSON POST; keypads; polling or endpoint push; 3-step file upload. |
| Soroush+ | `https://api.splus.ir/bot<token>/METHOD` | [soroush-plus.md](soroush-plus.md) | Telegram-modelled but reduced: no polls/payments/inline mode/admin methods (third-party). |
| Telegram | `https://api.telegram.org/bot<token>/METHOD` | [telegram.md](telegram.md) | Reference implementation; Bot API 10.3 (2026-08-24); largest feature set. |
| Telegram relay | Cloudflare Worker | [../relay/telegram-cloudflare-relay.md](../relay/telegram-cloudflare-relay.md) | Transparent relay for the full Telegram API, with `worker.js` (../relay/worker.js). |
| (all) | — | [channel-messaging.md](channel-messaging.md) | How to send a message to a channel on each platform. |

## Original reference URLs supplied by the user
Bale https://docs.bale.ai · Eitaa https://developer.eitaa.com · Rubika https://rubika.ir/botapi · Soroush+ https://soroushplus.com/en/p/documents · Telegram https://core.telegram.org/bots/api
