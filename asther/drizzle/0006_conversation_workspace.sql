ALTER TABLE "chat_messages" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "chat_participants" ADD COLUMN "pinned" boolean DEFAULT false NOT NULL;