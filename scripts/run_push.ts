import { db } from '../server/db.ts';
import { sql } from 'drizzle-orm';

async function main() {
    try {
        await db.execute(sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "hiring_roles" varchar;`);
        await db.execute(sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_hiring" boolean DEFAULT false;`);
        await db.execute(sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "business_phone" varchar;`);
        await db.execute(sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "business_need" varchar;`);
        await db.execute(sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "business_partners" varchar;`);
        await db.execute(sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_networking_open" boolean DEFAULT true;`);
        await db.execute(sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "menu_data" text;`);
        await db.execute(sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "business_service" varchar;`);
        await db.execute(sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "business_slogan" text;`);
        await db.execute(sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "open_positions" integer;`);
        await db.execute(sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "display_age" varchar;`);
        await db.execute(sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "banner_photo" text;`);
        await db.execute(sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_public" boolean DEFAULT true;`);
        await db.execute(sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "dating_mode" text;`);
        
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS "waitlists" (
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
        `);
        
        console.log("Columns & tables added successfully");
    } catch(e) {
        console.error("Error adding columns", e);
    } finally {
        process.exit(0);
    }
}
main();
