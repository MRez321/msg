export class DestinationAdapterError extends Error {
  constructor(message) {
    super(message);
    this.name = 'DestinationAdapterError';
  }
}

// DestinationAdapter is the extensible seam for messenger destinations.
// Active implementation: TelegramChannelAdapter. Reserve adapters/ or
// destinations/ for Discord, Slack, WhatsApp, etc. later.
export class DestinationAdapter {
  constructor(id) {
    this.id = id;
  }
  // Returns true if the given Telegram user is allowed to drive this adapter.
  isAuthorized(userId) {
    return false;
  }
  // Deliver one inbound update to the destination channel. Returns a delivery
  // record { ok, channelMessageId, errorCode, errorDescription }.
  async deliver(update) {
    throw new DestinationAdapterError(`deliver not implemented for ${this.id}`);
  }
  // Prove the destination is reachable (e.g. getMe / getChat).
  async health() {
    return { ok: false, error: `health not implemented for ${this.id}` };
  }
}

import { tgCall } from './relay.js';

export class TelegramChannelAdapter extends DestinationAdapter {
  constructor({ token, channelId, allowedUserId } = {}) {
    super('telegram_channel');
    this.token = token || '';
    this.channelId = channelId || '';
    this.allowedUserId = allowedUserId ? String(allowedUserId) : '';
  }

  isAuthorized(userId) {
    if (!this.allowedUserId) return false;
    return String(userId) === this.allowedUserId;
  }

  async health() {
    try {
      await tgCall(this.token, 'getMe', {});
      return { ok: true, channel: this.channelId };
    } catch (err) {
      return { ok: false, error: err.message, code: err.code };
    }
  }

  // Pick the largest photo size (last in the array) for file_id reuse.
  static bestPhoto(photos) {
    if (!photos || photos.length === 0) return null;
    return photos[photos.length - 1];
  }

  async deliver(update) {
    const result = { ok: false, channelMessageId: null, errorCode: null, errorDescription: null };

    try {
      if (!this.token || !this.channelId) {
        throw new DestinationAdapterError('TelegramChannelAdapter not configured (token/channelId)');
      }

      const text = update.text || update.caption || '';
      const mediaGroupId = update.media_group_id;

      if (text && !mediaGroupId) {
        const sent = await tgCall(this.token, 'sendMessage', {
          chat_id: this.channelId,
          text,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        });
        result.ok = true;
        result.channelMessageId = sent.message_id;
        return result;
      }

      // Media: copy the file from the source chat by file_id (no re-upload).
      const media = this.pickMedia(update);
      if (media) {
        const sent = await tgCall(this.token, 'copyMessage', {
          chat_id: this.channelId,
          from_chat_id: update.chat.id,
          message_id: update.message_id,
          caption: update.caption || undefined,
        });
        result.ok = true;
        result.channelMessageId = sent.message_id;
        return result;
      }

      if (!text) {
        result.errorDescription = 'No sendable content in update';
        return result;
      }
    } catch (err) {
      result.errorCode = err.code;
      result.errorDescription = err.message;
      throw err;
    }

    result.errorDescription = 'No sendable content in update';
    return result;
  }

  pickMedia(update) {
    if (update.photo) return { type: 'photo', fileId: TelegramChannelAdapter.bestPhoto(update.photo).file_id };
    if (update.video) return { type: 'video', fileId: update.video.file_id };
    if (update.document) return { type: 'document', fileId: update.document.file_id };
    if (update.audio) return { type: 'audio', fileId: update.audio.file_id };
    if (update.voice) return { type: 'voice', fileId: update.voice.file_id };
    return null;
  }
}
