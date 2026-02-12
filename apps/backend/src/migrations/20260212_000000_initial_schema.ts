import { sql } from "drizzle-orm";
import type { MigrationArgs } from "@drepkovsky/drizzle-migrations";

export async function up({
  db,
}: MigrationArgs<"postgresql">): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."message_role" AS ENUM('user', 'assistant', 'system');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "user" (
      "id" text PRIMARY KEY NOT NULL,
      "name" text NOT NULL,
      "email" text NOT NULL,
      "email_verified" boolean DEFAULT false NOT NULL,
      "image" text,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
      "role" text,
      "banned" boolean DEFAULT false,
      "ban_reason" text,
      "ban_expires" timestamp with time zone,
      CONSTRAINT "user_email_unique" UNIQUE("email")
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "organization" (
      "id" text PRIMARY KEY NOT NULL,
      "name" text NOT NULL,
      "slug" text NOT NULL,
      "logo" text,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp with time zone,
      CONSTRAINT "organization_slug_unique" UNIQUE("slug")
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "account" (
      "id" text PRIMARY KEY NOT NULL,
      "user_id" text NOT NULL,
      "account_id" text NOT NULL,
      "provider_id" text NOT NULL,
      "access_token" text,
      "refresh_token" text,
      "id_token" text,
      "access_token_expires_at" timestamp with time zone,
      "refresh_token_expires_at" timestamp with time zone,
      "scope" text,
      "password" text,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "session" (
      "id" text PRIMARY KEY NOT NULL,
      "user_id" text NOT NULL,
      "token" text NOT NULL,
      "expires_at" timestamp with time zone NOT NULL,
      "ip_address" text,
      "user_agent" text,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
      "impersonated_by" text,
      "active_organization_id" text,
      CONSTRAINT "session_token_unique" UNIQUE("token")
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "verification" (
      "id" text PRIMARY KEY NOT NULL,
      "identifier" text NOT NULL,
      "value" text NOT NULL,
      "expires_at" timestamp with time zone NOT NULL,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "chat" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "user_id" text NOT NULL,
      "title" text NOT NULL,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
      "archived_at" timestamp with time zone
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "message" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "chat_id" uuid NOT NULL,
      "role" "message_role" NOT NULL,
      "content" text NOT NULL,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "member" (
      "id" text PRIMARY KEY NOT NULL,
      "organization_id" text NOT NULL,
      "user_id" text NOT NULL,
      "role" text DEFAULT 'member' NOT NULL,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "invitation" (
      "id" text PRIMARY KEY NOT NULL,
      "organization_id" text NOT NULL,
      "email" text NOT NULL,
      "role" text NOT NULL,
      "status" text DEFAULT 'pending' NOT NULL,
      "expires_at" timestamp with time zone,
      "inviter_id" text NOT NULL,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL
    );
  `);

  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `);

  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `);

  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "chat" ADD CONSTRAINT "chat_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `);

  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "message" ADD CONSTRAINT "message_chat_id_chat_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chat"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `);

  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "member" ADD CONSTRAINT "member_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `);

  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "member" ADD CONSTRAINT "member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `);

  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "invitation" ADD CONSTRAINT "invitation_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `);

  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "invitation" ADD CONSTRAINT "invitation_inviter_id_user_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "account_user_id_idx" ON "account" USING btree ("user_id");
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "chat_user_id_idx" ON "chat" USING btree ("user_id");
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "invitation_organization_id_idx" ON "invitation" USING btree ("organization_id");
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "member_organization_id_idx" ON "member" USING btree ("organization_id");
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "member_user_id_idx" ON "member" USING btree ("user_id");
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "message_chat_id_idx" ON "message" USING btree ("chat_id");
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "session_user_id_idx" ON "session" USING btree ("user_id");
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "verification_identifier_idx" ON "verification" USING btree ("identifier");
  `);
}

export async function down({
  db,
}: MigrationArgs<"postgresql">): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "verification_identifier_idx";
  `);
  await db.execute(sql`
    DROP INDEX IF EXISTS "session_user_id_idx";
  `);
  await db.execute(sql`
    DROP INDEX IF EXISTS "message_chat_id_idx";
  `);
  await db.execute(sql`
    DROP INDEX IF EXISTS "member_user_id_idx";
  `);
  await db.execute(sql`
    DROP INDEX IF EXISTS "member_organization_id_idx";
  `);
  await db.execute(sql`
    DROP INDEX IF EXISTS "invitation_organization_id_idx";
  `);
  await db.execute(sql`
    DROP INDEX IF EXISTS "chat_user_id_idx";
  `);
  await db.execute(sql`
    DROP INDEX IF EXISTS "account_user_id_idx";
  `);

  await db.execute(sql`
    ALTER TABLE "invitation" DROP CONSTRAINT IF EXISTS "invitation_inviter_id_user_id_fk";
  `);
  await db.execute(sql`
    ALTER TABLE "invitation" DROP CONSTRAINT IF EXISTS "invitation_organization_id_organization_id_fk";
  `);
  await db.execute(sql`
    ALTER TABLE "member" DROP CONSTRAINT IF EXISTS "member_user_id_user_id_fk";
  `);
  await db.execute(sql`
    ALTER TABLE "member" DROP CONSTRAINT IF EXISTS "member_organization_id_organization_id_fk";
  `);
  await db.execute(sql`
    ALTER TABLE "message" DROP CONSTRAINT IF EXISTS "message_chat_id_chat_id_fk";
  `);
  await db.execute(sql`
    ALTER TABLE "chat" DROP CONSTRAINT IF EXISTS "chat_user_id_user_id_fk";
  `);
  await db.execute(sql`
    ALTER TABLE "session" DROP CONSTRAINT IF EXISTS "session_user_id_user_id_fk";
  `);
  await db.execute(sql`
    ALTER TABLE "account" DROP CONSTRAINT IF EXISTS "account_user_id_user_id_fk";
  `);

  await db.execute(sql`
    DROP TABLE IF EXISTS "invitation";
  `);
  await db.execute(sql`
    DROP TABLE IF EXISTS "member";
  `);
  await db.execute(sql`
    DROP TABLE IF EXISTS "message";
  `);
  await db.execute(sql`
    DROP TABLE IF EXISTS "chat";
  `);
  await db.execute(sql`
    DROP TABLE IF EXISTS "verification";
  `);
  await db.execute(sql`
    DROP TABLE IF EXISTS "session";
  `);
  await db.execute(sql`
    DROP TABLE IF EXISTS "account";
  `);
  await db.execute(sql`
    DROP TABLE IF EXISTS "organization";
  `);
  await db.execute(sql`
    DROP TABLE IF EXISTS "user";
  `);

  await db.execute(sql`
    DROP TYPE IF EXISTS "public"."message_role";
  `);
}
