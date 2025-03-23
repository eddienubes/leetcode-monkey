CREATE TABLE "google_spreadsheets" (
	"uuid" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tg_chat_uuid" uuid NOT NULL,
	"spreadsheet_id" varchar NOT NULL,
	"spreadsheet_name" varchar NOT NULL,
	"refresh_token" varchar NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "google_spreadsheets_tg_chat_uuid_unique" UNIQUE("tg_chat_uuid"),
	CONSTRAINT "google_spreadsheets_spreadsheet_id_unique" UNIQUE("spreadsheet_id")
);
--> statement-breakpoint
ALTER TABLE "google_spreadsheets" ADD CONSTRAINT "google_spreadsheets_tg_chat_uuid_tg_chats_uuid_fk" FOREIGN KEY ("tg_chat_uuid") REFERENCES "public"."tg_chats"("uuid") ON DELETE no action ON UPDATE no action;