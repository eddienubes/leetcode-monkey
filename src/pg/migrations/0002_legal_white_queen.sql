ALTER TABLE "lc_chat_settings" RENAME COLUMN "is_active" TO "is_notifications_enabled";--> statement-breakpoint
ALTER TABLE "lc_chat_settings" RENAME COLUMN "is_active_toggled_at" TO "is_notifications_enabled_toggled_at";--> statement-breakpoint
ALTER TABLE "lc_users_in_tg_chats" RENAME COLUMN "is_active" TO "is_notifications_enabled";--> statement-breakpoint
ALTER TABLE "lc_users_in_tg_chats" RENAME COLUMN "is_active_toggled_at" TO "is_notifications_enabled_toggled_at";--> statement-breakpoint
ALTER TABLE "lc_users_in_tg_chats" ADD COLUMN "is_connected" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "lc_users_in_tg_chats" ADD COLUMN "is_connected_toggled_at" timestamp with time zone;