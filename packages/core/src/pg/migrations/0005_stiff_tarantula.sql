CREATE TABLE "google_spreadsheet_updates" (
	"uuid" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lc_user_uuid" uuid NOT NULL,
	"tg_chat_uuid" uuid NOT NULL,
	"last_updated_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "google_spreadsheet_updates_tg_chat_uuid_lc_user_uuid_unique" UNIQUE("tg_chat_uuid","lc_user_uuid")
);
--> statement-breakpoint
ALTER TABLE "google_spreadsheet_updates" ADD CONSTRAINT "google_spreadsheet_updates_lc_user_uuid_lc_users_uuid_fk" FOREIGN KEY ("lc_user_uuid") REFERENCES "public"."lc_users"("uuid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "google_spreadsheet_updates" ADD CONSTRAINT "google_spreadsheet_updates_tg_chat_uuid_tg_chats_uuid_fk" FOREIGN KEY ("tg_chat_uuid") REFERENCES "public"."tg_chats"("uuid") ON DELETE no action ON UPDATE no action;