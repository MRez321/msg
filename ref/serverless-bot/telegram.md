# Telegram Bot API — Agent Reference (Bot API 10.3)

> Audience: coding agents. Written 2026-11-16.
> Evidence tags: `[VERIFIED-OFFICIAL]` = read from https://core.telegram.org/bots/api or https://core.telegram.org/bots/api-changelog (fetched 2026-11-16); `[THIRD-PARTY]`; `[NOT VERIFIED]`.
> **Coverage limit:** the fetch of the official API page was cut off partway through the `Message`-related types (after `ReplyParameters`). Parameter tables for individual methods (sendMessage, sendPhoto, …) were NOT retrieved. Method names below come from the official changelog; their parameters are `[NOT VERIFIED]` unless stated. The official machine-readable page is `https://core.telegram.org/bots/api.md` — fetch it to complete this file.

## 1. What this API is capable of
`[VERIFIED-OFFICIAL]` An HTTP-based interface for building Telegram bots. Features named in the official docs/changelog: messaging and media, inline keyboards and reply keyboards, inline mode, callback queries, polls and quizzes, payments (incl. Telegram Stars, subscriptions, paid media), stickers, chat/member/admin management, forum topics, reactions, chat boosts, giveaways, gifts, stories (business accounts), Business account integration, Mini Apps, managed bots, guest mode, ephemeral messages, communities, rich messages (10.1+), message drafts/streaming, checklists, suggested posts and channel direct messages, verification on behalf of organisations.

## 2. What it needs to work
- `[VERIFIED-OFFICIAL]` A bot token from @BotFather (looks like `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`).
- `[VERIFIED-OFFICIAL]` HTTPS only: `https://api.telegram.org/bot<token>/METHOD_NAME`. Methods are case-insensitive; UTF-8.
- `[VERIFIED-OFFICIAL]` GET and POST. Parameters via: URL query string; `application/x-www-form-urlencoded`; `application/json` (not for file uploads); `multipart/form-data` (for uploads).
- `[VERIFIED-OFFICIAL]` Webhook replies: you can perform a Bot API call in the HTTP response to a webhook by putting the method in a `method` parameter; success/result cannot be known.

## 3. Response format `[VERIFIED-OFFICIAL]`
JSON with boolean `ok`; optional string `description`; if `ok=true`, result in `result`. On failure `ok=false`, integer `error_code` (contents may change), and optional `parameters` of type `ResponseParameters` for automatic handling.

## 4. Local Bot API server `[VERIFIED-OFFICIAL]`
Source: https://github.com/tdlib/telegram-bot-api. Running it locally allows: downloads without size limit; uploads up to 2000 MB; upload via local path / `file://` URI; HTTP webhook URLs; any local IP and any port for webhooks; `max_webhook_connections` up to 100000; `file_path` returned as absolute local path.

## 5. Receiving updates `[VERIFIED-OFFICIAL]`
Two mutually exclusive ways: `getUpdates` or webhook (`setWebhook`). Updates are stored up to 24 hours.
### Update object — at most one optional field present
`update_id` (Integer; sequential; random if no updates for a week), `message`, `edited_message`, `channel_post`, `edited_channel_post`, `business_connection`, `business_message`, `edited_business_message`, `deleted_business_messages`, `guest_message`, `message_reaction`*, `message_reaction_count`*, `inline_query`, `chosen_inline_result`, `callback_query`, `shipping_query`, `pre_checkout_query`, `purchased_paid_media`, `poll`, `poll_answer`, `my_chat_member`, `chat_member`*, `chat_join_request`, `chat_boost`, `removed_chat_boost`, `managed_bot`, `subscription`, `stopped_message_generation`.
(* must be listed explicitly in `allowed_updates`; `chat_member`, `message_reaction`, `message_reaction_count` are excluded by default.)
### getUpdates
`offset` (Integer; > highest previous update_id; negative reads from end), `limit` (1–100, default 100), `timeout` (seconds, long polling; default 0), `allowed_updates` (Array of String). Does not work while a webhook is set.
### setWebhook
`url` (String, required; empty string removes), `certificate` (InputFile), `ip_address`, `max_connections` (1–100, default 40), `allowed_updates`, `drop_pending_updates`, `secret_token` (1–256 chars `A-Z a-z 0-9 _ -`; sent in header `X-Telegram-Bot-Api-Secret-Token`). Ports: **443, 80, 88, 8443**. On non-2xx, Telegram retries and gives up after a reasonable number of attempts.
### deleteWebhook
`drop_pending_updates` (Boolean). ### getWebhookInfo → `WebhookInfo`: url, has_custom_certificate, pending_update_count, ip_address?, last_error_date?, last_error_message?, last_synchronization_error_date?, max_connections?, allowed_updates?.

## 6. Core types (fields `[VERIFIED-OFFICIAL]`)
- `User`: id (≤52 significant bits), is_bot, first_name, last_name?, username?, language_code?, is_premium?, added_to_attachment_menu?, and (only in getMe) can_join_groups, can_read_all_group_messages, supports_guest_queries, supports_inline_queries, can_connect_to_business, has_main_web_app, has_topics_enabled, allows_users_to_create_topics, can_manage_bots, supports_join_request_queries.
- `Chat`: id (≤52 bits), type (`private`|`group`|`supergroup`|`channel`), title?, username?, first_name?, last_name?, is_forum?, is_direct_messages?
- `ChatFullInfo`: Chat fields + accent_color_id, max_reaction_count, photo, active_usernames, birthdate, business_intro/location/opening_hours, personal_chat, parent_chat, available_reactions, bio, join_to_send_messages, join_by_request, description, invite_link, pinned_message, permissions, accepted_gift_types, can_send_paid_media (channels), slow_mode_delay, message_auto_delete_time, has_protected_content, has_visible_history, linked_chat_id, location, rating, paid_message_star_count, guard_bot, community, and more.
- `Message`: message_id (0 for ephemeral/auto-scheduled video messages), message_thread_id?, direct_messages_topic?, from? (**may be empty for messages sent to channels**), sender_chat?, date, chat, forward_origin?, reply_to_message?, external_reply?, quote?, via_bot?, edit_date?, author_signature? (channel post author), text?, entities?, link_preview_options?, effect_id?, rich_message?, media fields (animation, audio, document, live_photo, paid_media, photo, sticker, story, video, video_note, voice), caption?, caption_entities?, show_caption_above_media?, has_media_spoiler?, contact?, dice?, game?, poll?, venue?, location?, many service-message fields (new_chat_members, pinned_message, forum_topic_*, giveaway_*, suggested_post_*, video_chat_*, etc.), reply_markup? (InlineKeyboardMarkup).
- `MessageEntity`: type (`mention`, `hashtag`, `cashtag`, `bot_command`, `url`, `email`, `phone_number`, `bold`, `italic`, `underline`, `strikethrough`, `spoiler`, `blockquote`, `expandable_blockquote`, `code`, `pre`, `text_link`, `text_mention`, `custom_emoji`, `date_time`), offset and length in UTF-16 code units, plus url / user / language / custom_emoji_id / unix_time / date_time_format by type.
- `MessageId`, `InaccessibleMessage`, `MaybeInaccessibleMessage`, `TextQuote`, `ExternalReplyInfo`, `ReplyParameters` (partial: message_id? …; `ephemeral_message_id`, `poll_option_id`, `checklist_task_id` added later) — `[NOT VERIFIED]` complete tables.

## 7. Methods
### 7a. Fully read: getUpdates, setWebhook, deleteWebhook, getWebhookInfo (see §5).
### 7b. Named in official changelog/page (names `[VERIFIED-OFFICIAL]`, parameters `[NOT VERIFIED]` unless noted)
- **Send:** sendMessage, sendPhoto, sendAudio, sendDocument, sendVideo, sendAnimation, sendVoice, sendVideoNote, sendLivePhoto, sendPaidMedia, sendMediaGroup, sendSticker, sendLocation, sendVenue, sendContact, sendPoll, sendDice, sendChecklist, sendGame, sendInvoice, sendGift, sendRichMessage, sendMessageDraft, sendRichMessageDraft, sendChatAction.
- **Forward/copy:** forwardMessage, forwardMessages, copyMessage, copyMessages.
- **Edit/delete:** editMessageText (has `rich_message` param since 10.1), editMessageCaption, editMessageMedia, editMessageLiveLocation, stopMessageLiveLocation, editMessageReplyMarkup, editMessageChecklist, stopPoll, deleteMessage, deleteMessages, editEphemeralMessageText/Media/Caption/ReplyMarkup, deleteEphemeralMessage.
- **Reactions:** setMessageReaction, deleteMessageReaction, deleteAllMessageReactions.
- **Files/info:** getMe, getFile, getUserProfileAudios, getChat, getChatMember, getChatAdministrators (`return_bots` param), getUserChatBoosts, getAvailableGifts.
- **Chat admin:** pinChatMessage, unpinChatMessage (both take `business_connection_id`), promoteChatMember (params incl. can_post_stories/edit/delete, can_manage_direct_messages, can_manage_tags, can_send_welcome_messages), restrictChatMember, setChatPermissions (both take `use_independent_chat_permissions`), setChatMemberTag, createChatSubscriptionInviteLink, editChatSubscriptionInviteLink, answerChatJoinRequestQuery, sendChatJoinRequestWebApp.
- **Forum topics:** createForumTopic, editForumTopic, deleteForumTopic, unpinAllForumTopicMessages, unpinAllGeneralForumTopicMessages, editGeneralForumTopic, closeGeneralForumTopic, reopenGeneralForumTopic, hideGeneralForumTopic, unhideGeneralForumTopic.
- **Inline / web app:** answerInlineQuery, answerGuestQuery, savePreparedInlineMessage, savePreparedKeyboardButton.
- **Payments/Stars:** createInvoiceLink (`subscription_period`, `business_connection_id`), refundStarPayment, getStarTransactions, getMyStarBalance, editUserStarSubscription.
- **Stickers:** uploadStickerFile, createNewStickerSet, addStickerToSet, replaceStickerInSet, setStickerSetThumbnail, setCustomEmojiStickerSetThumbnail, setStickerSetTitle, deleteStickerSet, setStickerEmojiList, setStickerKeywords, setStickerMaskPosition, getCustomEmojiStickers.
- **Bot profile:** setMyName/getMyName, setMyDescription/getMyDescription, setMyShortDescription/getMyShortDescription, setMyProfilePhoto, removeMyProfilePhoto, setUserEmojiStatus.
- **Business accounts:** getBusinessConnection, readBusinessMessage, deleteBusinessMessages, setBusinessAccountName/Username/Bio/ProfilePhoto, removeBusinessAccountProfilePhoto, setBusinessAccountGiftSettings, getBusinessAccountStarBalance, transferBusinessAccountStars, getBusinessAccountGifts, convertGiftToStars, upgradeGift, transferGift, giftPremiumSubscription, getUserGifts, getChatGifts, postStory, editStory, deleteStory, repostStory, getUserPersonalChatMessages.
- **Suggested posts / verification:** approveSuggestedPost, declineSuggestedPost, verifyUser, verifyChat, removeUserVerification, removeChatVerification.
- **Managed bots:** getManagedBotToken, replaceManagedBotToken, getManagedBotAccessSettings, setManagedBotAccessSettings.
`[NOT VERIFIED]` Classic methods that predate 6.3 and are not named in the changelog excerpt I read (e.g. banChatMember, unbanChatMember, leaveChat, setChatTitle, setChatDescription, setChatPhoto, exportChatInviteLink, createChatInviteLink, answerCallbackQuery, setMyCommands, deleteWebhook alternatives, setChatMenuButton, shipping/pre-checkout answers, game score methods, passport) may exist but their names/parameters were not read from the official page here.

## 8. Limits and rules named in the official text `[VERIFIED-OFFICIAL]`
- Poll: up to 12 options (9.1); minimum options 1 (10.0); max auto-close 2628000 seconds (9.6).
- Paid media max price 25000 Stars (9.3); subscription period max price 10000 Stars (9.0).
- Messages with video sent to groups/channels with large audience may be auto-scheduled; they have `message_id` 0 until sent.
- `allow_paid_broadcast` (third-party mirror text): up to 1000 msgs/s for 0.1 Stars per message `[THIRD-PARTY]` (aiogram docs).
- Mini Apps: methods from non-original origins are disallowed (enforced from 2026-07-20 unless opted out).

## 9. Sending to a channel — see `channel-messaging.md`.

## 10. References used
- https://core.telegram.org/bots/api (fetched 2026-11-16; truncated)
- https://core.telegram.org/bots/api-changelog (fetched; 6.3 → 10.3 portion)
- https://docs.aiogram.dev/en/v3.17.0/api/methods/send_message.html (third-party mirror of official sendMessage text)
- Machine-readable official page to complete this file: https://core.telegram.org/bots/api.md
