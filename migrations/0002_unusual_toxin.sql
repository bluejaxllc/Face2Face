ALTER TABLE "users" ADD COLUMN "xp" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "level" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "current_streak" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "longest_streak" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_login_date" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "badges" text;