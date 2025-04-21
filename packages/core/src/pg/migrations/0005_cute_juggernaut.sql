CREATE TABLE "google_spreadsheet_updates" (
	"uuid" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"google_spreadsheet_uuid" uuid NOT NULL,
	"tg_chat_uuid" uuid NOT NULL,
	"last_updated_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "google_spreadsheet_updates_tg_chat_uuid_google_spreadsheet_uuid_unique" UNIQUE("tg_chat_uuid","google_spreadsheet_uuid")
);
--> statement-breakpoint
ALTER TABLE "google_spreadsheet_updates" ADD CONSTRAINT "google_spreadsheet_updates_google_spreadsheet_uuid_google_spreadsheets_uuid_fk" FOREIGN KEY ("google_spreadsheet_uuid") REFERENCES "public"."google_spreadsheets"("uuid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "google_spreadsheet_updates" ADD CONSTRAINT "google_spreadsheet_updates_tg_chat_uuid_tg_chats_uuid_fk" FOREIGN KEY ("tg_chat_uuid") REFERENCES "public"."tg_chats"("uuid") ON DELETE no action ON UPDATE no action;