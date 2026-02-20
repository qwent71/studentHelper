
  import { sql } from 'drizzle-orm'
  import type { MigrationArgs } from '@drepkovsky/drizzle-migrations'

  export async function up({ db }: MigrationArgs<'postgresql'>): Promise<void> {
  await db.execute(sql`
          CREATE TYPE "public"."chat_mode" AS ENUM('fast', 'learning');
CREATE TYPE "public"."chat_status" AS ENUM('active', 'completed', 'archived');
CREATE TYPE "public"."message_source_type" AS ENUM('text', 'image', 'rag');
ALTER TABLE "chat" ADD COLUMN "mode" "chat_mode" DEFAULT 'fast' NOT NULL;
ALTER TABLE "chat" ADD COLUMN "status" "chat_status" DEFAULT 'active' NOT NULL;
ALTER TABLE "chat" ADD COLUMN "ended_at" timestamp with time zone;
ALTER TABLE "message" ADD COLUMN "source_type" "message_source_type" DEFAULT 'text' NOT NULL;
        `);
  
  };

  export async function down({ db }: MigrationArgs<'postgresql'>): Promise<void> {
  await db.execute(sql`
          ALTER TABLE "chat" DROP COLUMN "mode";
ALTER TABLE "chat" DROP COLUMN "status";
ALTER TABLE "chat" DROP COLUMN "ended_at";
ALTER TABLE "message" DROP COLUMN "source_type";
DROP TYPE "public"."chat_mode";
DROP TYPE "public"."chat_status";
DROP TYPE "public"."message_source_type";
        `);
  
  };
  