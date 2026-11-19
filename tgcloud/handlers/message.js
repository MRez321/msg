import { api, db } from 'sdk';
import { eq } from 'sdk/db';
import { TelegramChannelAdapter } from '../lib/adapter.js';
import { loadConfig } from '../lib/config.js';
import { deliveryLogs } from '../schema.js';

const cfg = loadConfig();
const adapter = new TelegramChannelAdapter({
  token: cfg.botToken,
  channelId: cfg.channelId,
  allowedUserId: cfg.allowedUserId,
});

async function logDelivery({ updateId, userId, sourceChatId, messageType, channelId, status, channelMessageId, errorCode, errorDescription }) {
  try {
    await db.insert(deliveryLogs)
      .values({
        updateId,
        userId,
        sourceChatId,
        messageType,
        channelId,
        status,
        channelMessageId,
        errorCode,
        errorDescription,
      })
      .run();
  } catch {
    // Logging must never break the delivery flow.
  }
}

async function replyToUser(chatId, text) {
  try {
    await api.sendMessage({ chat_id: chatId, text });
  } catch {
    // Best-effort confirmation; delivery log already recorded the outcome.
  }
}

function messageTypeOf(update) {
  if (update.photo) return 'photo';
  if (update.video) return 'video';
  if (update.document) return 'document';
  if (update.audio) return 'audio';
  if (update.voice) return 'voice';
  if (update.text) return 'text';
  return 'unknown';
}

export default async function (payload, ctx) {
  const userId = payload.from && payload.from.id;
  const chatId = payload.chat && payload.chat.id;
  const updateId = ctx.update && ctx.update.update_id;

  // Unauthorized users are ignored silently.
  if (!adapter.isAuthorized(userId)) {
    return;
  }

  const type = messageTypeOf(payload);
  const channelId = cfg.channelId;

  if (!channelId) {
    await logDelivery({
      updateId, userId, sourceChatId: chatId, messageType: type, channelId: '(unset)',
      status: 'failed', channelMessageId: null, errorCode: null, errorDescription: 'TARGET_TELEGRAM_CHANNEL_ID not set',
    });
    await replyToUser(chatId, 'Bot is not configured: TARGET_TELEGRAM_CHANNEL_ID is missing.');
    return;
  }

  let delivery;
  try {
    delivery = await adapter.deliver(payload);
  } catch (err) {
    delivery = {
      ok: false,
      channelMessageId: null,
      errorCode: err.code,
      errorDescription: err.message,
    };
  }

  const status = delivery.ok ? 'sent' : 'failed';

  await logDelivery({
    updateId,
    userId,
    sourceChatId: chatId,
    messageType: type,
    channelId,
    status,
    channelMessageId: delivery.channelMessageId || null,
    errorCode: delivery.errorCode || null,
    errorDescription: delivery.errorDescription || null,
  });

  if (delivery.ok) {
    await replyToUser(chatId, `Delivered to channel ${channelId} (message ${delivery.channelMessageId}).`);
  } else {
    await replyToUser(chatId, `Delivery failed: ${delivery.errorDescription || 'unknown error'}.`);
  }
}
