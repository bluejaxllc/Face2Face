CREATE TABLE "blocks" (
	"id" serial PRIMARY KEY NOT NULL,
	"blocker_id" integer NOT NULL,
	"blocked_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "community_groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"image_url" text,
	CONSTRAINT "community_groups_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "dating_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" text NOT NULL,
	"title" text,
	"description" text NOT NULL,
	"date" text,
	"location" text,
	"timestamp" timestamp DEFAULT now(),
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"reporter_id" integer NOT NULL,
	"reported_id" integer NOT NULL,
	"reason" text NOT NULL,
	"details" text,
	"status" text DEFAULT 'pending',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"is_approved" boolean DEFAULT true,
	CONSTRAINT "tags_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "waitlists" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"business_name" text,
	"location" text,
	"phone" text,
	"social_link" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
DROP INDEX "sender_id_idx";--> statement-breakpoint
DROP INDEX "receiver_id_idx";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "category" SET DEFAULT 'friendships';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "sex" text DEFAULT 'female' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "display_age" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "date_of_birth" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "push_token" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "subscription_tier" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "subscription_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "job_title" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "company" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "industry" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "skills" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "networking_goal" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "linkedin_url" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "portfolio_url" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "professional_motto" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "vibe_status" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "current_activity" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "icebreaker" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "weekend_vibe" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "social_battery" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "relationship_goal" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "dating_mode" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "love_language" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "mbti" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "perfect_date" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "lifestyle_coffee" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "lifestyle_alcohol" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "lifestyle_schedule" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "banner_photo" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_public" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "business_slogan" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "business_phone" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "business_service" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "business_need" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "business_partners" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_networking_open" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_hiring" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "open_positions" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "hiring_roles" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "menu_data" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "website_url" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "menu_url" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "booking_url" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
CREATE INDEX "block_blocker_idx" ON "blocks" USING btree ("blocker_id");--> statement-breakpoint
CREATE INDEX "block_blocked_idx" ON "blocks" USING btree ("blocked_id");--> statement-breakpoint
CREATE INDEX "report_reporter_idx" ON "reports" USING btree ("reporter_id");--> statement-breakpoint
CREATE INDEX "report_reported_idx" ON "reports" USING btree ("reported_id");--> statement-breakpoint
CREATE INDEX "tag_name_idx" ON "tags" USING btree ("name");--> statement-breakpoint
CREATE INDEX "tag_category_idx" ON "tags" USING btree ("category");--> statement-breakpoint
CREATE INDEX "message_sender_id_idx" ON "messages" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX "message_receiver_id_idx" ON "messages" USING btree ("receiver_id");--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "gender";