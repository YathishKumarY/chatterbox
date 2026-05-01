-- AlterTable
ALTER TABLE "conversation_participants" ADD COLUMN "is_pinned" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "conversation_participants" ADD COLUMN "is_favourite" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "conversation_participants" ADD COLUMN "is_marked_unread" BOOLEAN NOT NULL DEFAULT false;
