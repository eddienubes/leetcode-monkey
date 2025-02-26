CREATE TABLE "accepted_submissions" (
	"leetcode_user_uuid" uuid NOT NULL,
	"problemSlug" varchar NOT NULL,
	"title" varchar NOT NULL,
	"leetCodeId" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leetcode_user_settings_entries" (
	"notificationsEnabled" boolean DEFAULT false NOT NULL,
	"leetcode_user_uuid" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leetcode_users" (
	"uuid" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "leetcode_users_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "leetcode_users_to_tg_chats" (
	"leetcode_user_uuid" uuid NOT NULL,
	"tg_chat_uuid" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "leetcode_users_to_tg_chats_leetcode_user_uuid_tg_chat_uuid_unique" UNIQUE("leetcode_user_uuid","tg_chat_uuid")
);
--> statement-breakpoint
CREATE TABLE "tg_chats" (
	"uuid" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tg_id" varchar NOT NULL,
	"type" varchar NOT NULL,
	"title" varchar,
	"username" varchar,
	"fullname" varchar,
	"is_forum" boolean DEFAULT false NOT NULL,
	"description" varchar,
	"bio" varchar,
	"join_by_request" boolean DEFAULT false NOT NULL,
	"invite_link" varchar,
	"is_removed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tg_chats_tg_id_unique" UNIQUE("tg_id")
);
--> statement-breakpoint
ALTER TABLE "accepted_submissions" ADD CONSTRAINT "accepted_submissions_leetcode_user_uuid_leetcode_users_uuid_fk" FOREIGN KEY ("leetcode_user_uuid") REFERENCES "public"."leetcode_users"("uuid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leetcode_user_settings_entries" ADD CONSTRAINT "leetcode_user_settings_entries_leetcode_user_uuid_leetcode_users_uuid_fk" FOREIGN KEY ("leetcode_user_uuid") REFERENCES "public"."leetcode_users"("uuid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leetcode_users_to_tg_chats" ADD CONSTRAINT "leetcode_users_to_tg_chats_leetcode_user_uuid_leetcode_users_uuid_fk" FOREIGN KEY ("leetcode_user_uuid") REFERENCES "public"."leetcode_users"("uuid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leetcode_users_to_tg_chats" ADD CONSTRAINT "leetcode_users_to_tg_chats_tg_chat_uuid_tg_chats_uuid_fk" FOREIGN KEY ("tg_chat_uuid") REFERENCES "public"."tg_chats"("uuid") ON DELETE no action ON UPDATE no action;