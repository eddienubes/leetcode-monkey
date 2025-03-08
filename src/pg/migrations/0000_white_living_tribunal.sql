CREATE TABLE "accepted_submissions" (
	"lc_user_uuid" uuid NOT NULL,
	"lc_problem_uuid" uuid NOT NULL,
	"submitted_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "accepted_submissions_lc_user_uuid_lc_problem_uuid_unique" UNIQUE("lc_user_uuid","lc_problem_uuid")
);
--> statement-breakpoint
CREATE TABLE "lc_chat_settings" (
	"tg_chat_uuid" uuid NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "lc_chat_settings_tg_chat_uuid_unique" UNIQUE("tg_chat_uuid")
);
--> statement-breakpoint
CREATE TABLE "lc_problems" (
	"uuid" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar NOT NULL,
	"title" varchar NOT NULL,
	"difficulty" varchar NOT NULL,
	"lc_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "lc_problems_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "lc_users" (
	"uuid" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar NOT NULL,
	"realName" varchar,
	"avatarUrl" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "lc_users_slug_unique" UNIQUE("slug")
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
CREATE TABLE "tg_chats" (
	"uuid" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tg_id" varchar NOT NULL,
	"type" varchar NOT NULL,
	"title" varchar,
	"role" varchar NOT NULL,
	"username" varchar,
	"fullname" varchar,
	"is_forum" boolean DEFAULT false NOT NULL,
	"description" varchar,
	"bio" varchar,
	"join_by_request" boolean DEFAULT false NOT NULL,
	"invite_link" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tg_chats_tg_id_unique" UNIQUE("tg_id")
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
ALTER TABLE "accepted_submissions" ADD CONSTRAINT "accepted_submissions_lc_user_uuid_lc_users_uuid_fk" FOREIGN KEY ("lc_user_uuid") REFERENCES "public"."lc_users"("uuid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accepted_submissions" ADD CONSTRAINT "accepted_submissions_lc_problem_uuid_lc_problems_uuid_fk" FOREIGN KEY ("lc_problem_uuid") REFERENCES "public"."lc_problems"("uuid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lc_chat_settings" ADD CONSTRAINT "lc_chat_settings_tg_chat_uuid_tg_chats_uuid_fk" FOREIGN KEY ("tg_chat_uuid") REFERENCES "public"."tg_chats"("uuid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lc_users_to_users_in_chats" ADD CONSTRAINT "lc_users_to_users_in_chats_user_in_chat_uuid_tg_users_to_tg_chats_uuid_fk" FOREIGN KEY ("user_in_chat_uuid") REFERENCES "public"."tg_users_to_tg_chats"("uuid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lc_users_to_users_in_chats" ADD CONSTRAINT "lc_users_to_users_in_chats_lc_user_uuid_lc_users_uuid_fk" FOREIGN KEY ("lc_user_uuid") REFERENCES "public"."lc_users"("uuid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tg_users_to_tg_chats" ADD CONSTRAINT "tg_users_to_tg_chats_tg_chat_uuid_tg_chats_uuid_fk" FOREIGN KEY ("tg_chat_uuid") REFERENCES "public"."tg_chats"("uuid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tg_users_to_tg_chats" ADD CONSTRAINT "tg_users_to_tg_chats_tg_user_uuid_tg_users_uuid_fk" FOREIGN KEY ("tg_user_uuid") REFERENCES "public"."tg_users"("uuid") ON DELETE no action ON UPDATE no action;