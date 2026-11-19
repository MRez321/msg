# Messenger Bot APIs — Project Index

Created 2026-11-16. Start here. Everything in this folder was produced in one working session about the bot APIs of Bale, Eitaa, Rubika, Soroush+ and Telegram.

## Evidence marks used in every file
- `[VERIFIED-OFFICIAL]` read directly from the official documentation
- `[THIRD-PARTY]` from SDKs/READMEs, not official
- `[USER-PROVIDED]` from your own link list
- `[NOT VERIFIED]` could not be confirmed; test before use
(`relay` also uses `[VERIFIED-CF]` for Cloudflare docs, `[DESIGN]` for choices made in the worker code, and `[TESTED-MOCK]` for results from my local mock test.)

## Folder map
```
messenger-apis/
├── index.md                              <- this file
├── agent/                                <- written for coding agents
│   ├── README.md
│   ├── bale.md
│   ├── eitaa.md
│   ├── rubika.md
│   ├── soroush-plus.md
│   ├── telegram.md
│   └── channel-messaging.md
├── human/                                <- written for you (plain language)
│   ├── README.md
│   ├── bale.md
│   ├── eitaa.md
│   ├── rubika.md
│   ├── soroush-plus.md
│   ├── telegram.md
│   └── channel-messaging.md
└── relay/                                <- Telegram through Cloudflare
    ├── telegram-cloudflare-relay.md
    ├── worker.js
    └── wrangler.jsonc
```

## What each file is for
### Agent set (give these to coding agents)
| File | Purpose |
|---|---|
| [agent/README.md](agent/README.md) | Master index for agents: one-line summary and base URL of every API, plus a table of how complete each file is. |
| [agent/bale.md](agent/bale.md) | Full Bale Bot API reference: requests, responses, updates, file rules, every method with parameters, types, doc typos. Official docs were read; the page ended at `sendInvoice`. |
| [agent/eitaa.md](agent/eitaa.md) | Eitaa (EitaaYar) reference. Third-party sources only (official site blocks bots). Includes the base-URL conflict. |
| [agent/rubika.md](agent/rubika.md) | Rubika v3 reference: all methods, keypads, update format, file upload flow. Methods are official; models are partial. |
| [agent/soroush-plus.md](agent/soroush-plus.md) | Soroush+ reference. Third-party sources only; parameter tables unverified. |
| [agent/telegram.md](agent/telegram.md) | Telegram Bot API 10.3: updates, webhooks, core types, full method-name list from the changelog. Per-method parameters are missing. |
| [agent/channel-messaging.md](agent/channel-messaging.md) | How to send a message to a channel on all five platforms: endpoint, channel id form, required fields, curl examples, unknowns. |

### Human set (for you to read)
| File | Purpose |
|---|---|
| [human/README.md](human/README.md) | Reading guide: how to read the marks, how complete each file is, one paragraph per messenger. |
| [human/bale.md](human/bale.md), [eitaa.md](human/eitaa.md), [rubika.md](human/rubika.md), [soroush-plus.md](human/soroush-plus.md), [telegram.md](human/telegram.md) | Plain-language version of each API: what it is, what you need, what it can do, what to watch out for. |
| [human/channel-messaging.md](human/channel-messaging.md) | Plain-language channel-sending guide with a comparison table and examples. |

### Telegram relay (Cloudflare Worker)
| File | Purpose |
|---|---|
| [relay/telegram-cloudflare-relay.md](relay/telegram-cloudflare-relay.md) | Guide: how the relay works, what passes through, Cloudflare limits, deployment, configuration, security, examples, smoke test, unknowns. |
| [relay/worker.js](relay/worker.js) | The Cloudflare Worker code: transparent proxy for the whole Telegram Bot API, file downloads, and optional inbound webhook forwarding. |
| [relay/wrangler.jsonc](relay/wrangler.jsonc) | Minimal Wrangler config for deploying `worker.js`. |

## Suggested reading order
1. `human/README.md` to understand what is and isn't verified.
2. `human/channel-messaging.md` if your goal is posting to channels.
3. `relay/telegram-cloudflare-relay.md` if Telegram must go through Cloudflare.
4. Hand the `agent` folder (and `relay`) to your coding agent.

## Known gaps (to close later)
| Gap | How to close it |
|---|---|
| Telegram per-method parameter tables | Provide `https://core.telegram.org/bots/api.md` |
| Eitaa and Soroush+ official docs | Save the official pages as text or PDF and provide them |
| Rubika models (Keypad, Button, Message, enums) | Save https://rubika.ir/botapi/models and provide it |
| Bale methods after `sendInvoice` | Save the remainder of https://docs.bale.ai |
| Relay real-world behaviour | Deploy and run the smoke test in the relay guide |

## Original reference URLs
Bale https://docs.bale.ai · Eitaa https://developer.eitaa.com · Rubika https://rubika.ir/botapi · Soroush+ https://soroushplus.com/en/p/documents · Telegram https://core.telegram.org/bots/api
