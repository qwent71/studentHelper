
  import { sql } from 'drizzle-orm'
  import type { MigrationArgs } from '@drepkovsky/drizzle-migrations'

  export async function up({ db }: MigrationArgs<'postgresql'>): Promise<void> {
  await db.execute(sql`
          ALTER TYPE "public"."safety_event_type" ADD VALUE 'access_violation';
        `);
  
  };

  export async function down({ db }: MigrationArgs<'postgresql'>): Promise<void> {
  await db.execute(sql`
          ALTER TABLE "safety_event" ALTER COLUMN "event_type" SET DATA TYPE text;
DROP TYPE "public"."safety_event_type";
CREATE TYPE "public"."safety_event_type" AS ENUM('blocked_prompt', 'unsafe_response_filtered', 'warning_shown');
ALTER TABLE "safety_event" ALTER COLUMN "event_type" SET DATA TYPE "public"."safety_event_type" USING "event_type"::"public"."safety_event_type";
        `);
  
  };
  