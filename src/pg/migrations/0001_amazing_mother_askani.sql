ALTER TABLE "tg_chats" ADD COLUMN "role" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "tg_chats" DROP COLUMN "is_removed";