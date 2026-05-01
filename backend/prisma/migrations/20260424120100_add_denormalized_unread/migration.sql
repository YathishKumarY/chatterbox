-- AlterTable
ALTER TABLE "conversation_participants" ADD COLUMN "unread_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "conversation_participants" ADD COLUMN "last_message_at" TIMESTAMP(3);
ALTER TABLE "conversation_participants" ADD COLUMN "last_message_preview" TEXT;
ALTER TABLE "conversation_participants" ADD COLUMN "last_message_sender_id" TEXT;

-- Backfill last message data
UPDATE "conversation_participants" cp
SET
  "last_message_at" = sub.created_at,
  "last_message_preview" = LEFT(sub.content, 100),
  "last_message_sender_id" = sub.sender_id
FROM (
  SELECT DISTINCT ON (m.conversation_id) m.conversation_id, m.created_at, m.content, m.sender_id
  FROM "messages" m
  ORDER BY m.conversation_id, m.created_at DESC
) sub
WHERE cp.conversation_id = sub.conversation_id;

-- Backfill unread counts
UPDATE "conversation_participants" cp
SET "unread_count" = sub.cnt
FROM (
  SELECT ms.user_id, m.conversation_id, COUNT(*) as cnt
  FROM "message_statuses" ms
  JOIN "messages" m ON m.id = ms.message_id
  WHERE ms.status != 'read'
  GROUP BY ms.user_id, m.conversation_id
) sub
WHERE cp.user_id = sub.user_id AND cp.conversation_id = sub.conversation_id;
