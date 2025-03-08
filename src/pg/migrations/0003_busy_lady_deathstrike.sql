CREATE TABLE "lc_chat_settings" (
	"tg_chat_uuid" uuid NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "lc_chat_settings_tg_chat_uuid_unique" UNIQUE("tg_chat_uuid")
);
--> statement-breakpoint
CREATE TABLE "lc_users_to_users_in_chats" (
	"user_in_chat_uuid" uuid NOT NULL,
	"lc_user_uuid" uuid NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "lc_users_to_users_in_chats_user_in_chat_uuid_unique" UNIQUE("user_in_chat_uuid")
);
--> statement-breakpoint
CREATE TABLE "tg_users" (
	"uuid" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tg_id" varchar NOT NULL,
	"is_bot" boolean DEFAULT false NOT NULL,
	"first_name" varchar NOT NULL,
	"last_name" varchar,
	"username" varchar,
	"language_code" varchar,
	"is_premium" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tg_users_tg_id_unique" UNIQUE("tg_id")
);
--> statement-breakpoint
CREATE TABLE "tg_users_to_tg_chats" (
	"uuid" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tg_chat_uuid" uuid NOT NULL,
	"tg_user_uuid" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tg_users_to_tg_chats_tg_user_uuid_tg_chat_uuid_unique" UNIQUE("tg_user_uuid","tg_chat_uuid")
);
--> statement-breakpoint
ALTER TABLE "lc_user_settings_entries" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "lc_users_to_tg_chats" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "lc_user_settings_entries" CASCADE;--> statement-breakpoint
DROP TABLE "lc_users_to_tg_chats" CASCADE;--> statement-breakpoint
ALTER TABLE "accepted_submissions" ADD COLUMN "slug" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "accepted_submissions" ADD COLUMN "lc_id" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "accepted_submissions" ADD COLUMN "submitted_at" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "lc_chat_settings" ADD CONSTRAINT "lc_chat_settings_tg_chat_uuid_tg_chats_uuid_fk" FOREIGN KEY ("tg_chat_uuid") REFERENCES "public"."tg_chats"("uuid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lc_users_to_users_in_chats" ADD CONSTRAINT "lc_users_to_users_in_chats_user_in_chat_uuid_tg_users_to_tg_chats_uuid_fk" FOREIGN KEY ("user_in_chat_uuid") REFERENCES "public"."tg_users_to_tg_chats"("uuid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lc_users_to_users_in_chats" ADD CONSTRAINT "lc_users_to_users_in_chats_lc_user_uuid_lc_users_uuid_fk" FOREIGN KEY ("lc_user_uuid") REFERENCES "public"."lc_users"("uuid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tg_users_to_tg_chats" ADD CONSTRAINT "tg_users_to_tg_chats_tg_chat_uuid_tg_chats_uuid_fk" FOREIGN KEY ("tg_chat_uuid") REFERENCES "public"."tg_chats"("uuid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tg_users_to_tg_chats" ADD CONSTRAINT "tg_users_to_tg_chats_tg_user_uuid_tg_users_uuid_fk" FOREIGN KEY ("tg_user_uuid") REFERENCES "public"."tg_users"("uuid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accepted_submissions" DROP COLUMN "problemSlug";--> statement-breakpoint
ALTER TABLE "accepted_submissions" DROP COLUMN "lcId";--> statement-breakpoint
ALTER TABLE "accepted_submissions" ADD CONSTRAINT "accepted_submissions_slug_unique" UNIQUE("slug");