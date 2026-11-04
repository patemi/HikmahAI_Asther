CREATE TABLE "conversation_shares" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"participant_id" uuid NOT NULL,
	"snapshot" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "conversation_shares_participant_id_unique" UNIQUE("participant_id")
);
--> statement-breakpoint
ALTER TABLE "chat_messages" ADD COLUMN "attachments" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD COLUMN "feedback" text;--> statement-breakpoint
ALTER TABLE "chat_participants" ADD COLUMN "archived" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "conversation_shares" ADD CONSTRAINT "conversation_shares_participant_id_chat_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."chat_participants"("id") ON DELETE cascade ON UPDATE no action;