-- AlterTable
ALTER TABLE "users" ADD COLUMN "avatar_data" TEXT;

-- AlterTable
ALTER TABLE "conversations" ADD COLUMN "avatar_data" TEXT;

-- AlterTable
ALTER TABLE "conversation_participants" ADD COLUMN "is_archived" BOOLEAN NOT NULL DEFAULT false;
