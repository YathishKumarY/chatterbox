-- AlterTable (idempotent: only add if not exists)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='conversations' AND column_name='avatar_data') THEN
    ALTER TABLE "conversations" ADD COLUMN "avatar_data" TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='conversation_participants' AND column_name='is_archived') THEN
    ALTER TABLE "conversation_participants" ADD COLUMN "is_archived" BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;
