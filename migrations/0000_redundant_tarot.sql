CREATE TABLE "bumps" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"bumped_user_id" integer NOT NULL,
	"timestamp" timestamp DEFAULT now(),
	"seen" boolean DEFAULT false,
	"status" text DEFAULT 'pending',
	"message" text
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"sender_id" integer NOT NULL,
	"receiver_id" integer NOT NULL,
	"content" text NOT NULL,
	"timestamp" timestamp DEFAULT now(),
	"read" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" text NOT NULL,
	"related_id" integer,
	"content" text NOT NULL,
	"timestamp" timestamp DEFAULT now(),
	"read" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"gender" text DEFAULT 'female' NOT NULL,
	"age" integer DEFAULT 18 NOT NULL,
	"height" text,
	"weight" text,
	"self_rating" integer DEFAULT 5,
	"category" text DEFAULT 'casual',
	"bio" text,
	"dating_preference" text DEFAULT 'women',
	"favorite_color" text,
	"favorite_song" text,
	"field_of_study" text,
	"interests" text,
	"seeking" text,
	"bump_message" text,
	"is_active" boolean DEFAULT true,
	"inactive_timeout" integer DEFAULT 30,
	"latitude" numeric DEFAULT '0' NOT NULL,
	"longitude" numeric DEFAULT '0' NOT NULL,
	"last_location" timestamp,
	"profile_completed" boolean DEFAULT false,
	"profile_photo" text,
	"phone_number" text,
	"is_phone_verified" boolean DEFAULT false,
	"safety_acknowledged" boolean DEFAULT false,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_phone_number_unique" UNIQUE("phone_number")
);
--> statement-breakpoint
CREATE TABLE "verification_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"phone_number" text NOT NULL,
	"code" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX "bump_user_id_idx" ON "bumps" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "bumped_user_id_idx" ON "bumps" USING btree ("bumped_user_id");--> statement-breakpoint
CREATE INDEX "sender_id_idx" ON "messages" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX "receiver_id_idx" ON "messages" USING btree ("receiver_id");--> statement-breakpoint
CREATE INDEX "notification_user_id_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "username_idx" ON "users" USING btree ("username");--> statement-breakpoint
CREATE INDEX "email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "phone_idx" ON "users" USING btree ("phone_number");--> statement-breakpoint
CREATE INDEX "is_active_idx" ON "users" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "phone_code_idx" ON "verification_codes" USING btree ("phone_number","code");