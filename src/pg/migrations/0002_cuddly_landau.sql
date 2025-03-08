ALTER TABLE "lc_users_to_tg_chats" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "lc_users_to_tg_chats" DROP COLUMN "active";