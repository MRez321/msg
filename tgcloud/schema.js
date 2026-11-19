import { table, integer, text, index, sql } from 'sdk/db';

export const deliveryLogs = table('delivery_logs', {
  id:             integer('id').primaryKey({ autoIncrement: true }),
  updateId:       integer('update_id').notNull(),
  userId:         integer('user_id').notNull(),
  sourceChatId:   integer('source_chat_id'),
  messageType:    text('message_type').notNull(),   // text | photo | video | document | audio | voice | media_group | unknown
  channelId:      text('channel_id').notNull(),
  status:         text('status').notNull(),         // sent | failed | skipped_unauthorized | skipped_no_content
  channelMessageId: integer('channel_message_id'),
  errorCode:      integer('error_code'),
  errorDescription: text('error_description'),
  createdAt:      integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
}, (t) => ({
  userIdx:   index('idx_delivery_logs_user_id').on(t.userId),
  statusIdx: index('idx_delivery_logs_status').on(t.status),
  typeIdx:   index('idx_delivery_logs_type').on(t.messageType),
  createdIdx:index('idx_delivery_logs_created').on(t.createdAt),
}));
