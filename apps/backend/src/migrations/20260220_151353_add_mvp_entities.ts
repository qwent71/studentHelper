
  import { sql } from 'drizzle-orm'
  import type { MigrationArgs } from '@drepkovsky/drizzle-migrations'

  export async function up({ db }: MigrationArgs<'postgresql'>): Promise<void> {
  await db.execute(sql`
          CREATE TYPE "public"."document_status" AS ENUM('uploaded', 'processed', 'failed');
CREATE TYPE "public"."grade_level" AS ENUM('5', '6', '7', '8', '9', '10', '11');
CREATE TYPE "public"."safety_event_type" AS ENUM('blocked_prompt', 'unsafe_response_filtered', 'warning_shown');
CREATE TYPE "public"."safety_severity" AS ENUM('low', 'medium', 'high');
CREATE TABLE "document_chunk" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"chunk_text" text NOT NULL,
	"embedding_vector" text,
	"page_ref" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "safety_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"session_id" uuid,
	"event_type" "safety_event_type" NOT NULL,
	"severity" "safety_severity" NOT NULL,
	"details" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "student_profile" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"grade_level" "grade_level",
	"preferred_language" text DEFAULT 'ru' NOT NULL,
	"default_template_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "student_profile_user_id_unique" UNIQUE("user_id")
);

CREATE TABLE "template_preset" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"tone" text DEFAULT 'friendly' NOT NULL,
	"knowledge_level" text DEFAULT 'basic' NOT NULL,
	"output_format" text DEFAULT 'full' NOT NULL,
	"output_language" text DEFAULT 'ru' NOT NULL,
	"response_length" text DEFAULT 'medium' NOT NULL,
	"extra_preferences" jsonb,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "uploaded_document" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"file_name" text NOT NULL,
	"file_type" text NOT NULL,
	"storage_key" text NOT NULL,
	"status" "document_status" DEFAULT 'uploaded' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);

ALTER TABLE "document_chunk" ADD CONSTRAINT "document_chunk_document_id_uploaded_document_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."uploaded_document"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "safety_event" ADD CONSTRAINT "safety_event_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "student_profile" ADD CONSTRAINT "student_profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "student_profile" ADD CONSTRAINT "student_profile_default_template_id_template_preset_id_fk" FOREIGN KEY ("default_template_id") REFERENCES "public"."template_preset"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "template_preset" ADD CONSTRAINT "template_preset_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "uploaded_document" ADD CONSTRAINT "uploaded_document_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
CREATE INDEX "document_chunk_document_id_idx" ON "document_chunk" USING btree ("document_id");
CREATE INDEX "safety_event_user_id_idx" ON "safety_event" USING btree ("user_id");
CREATE INDEX "safety_event_event_type_idx" ON "safety_event" USING btree ("event_type");
CREATE INDEX "student_profile_user_id_idx" ON "student_profile" USING btree ("user_id");
CREATE INDEX "template_preset_user_id_idx" ON "template_preset" USING btree ("user_id");
CREATE INDEX "uploaded_document_user_id_idx" ON "uploaded_document" USING btree ("user_id");
        `);
  
  };

  export async function down({ db }: MigrationArgs<'postgresql'>): Promise<void> {
  await db.execute(sql`
          DROP TABLE "document_chunk" CASCADE;
DROP TABLE "safety_event" CASCADE;
DROP TABLE "student_profile" CASCADE;
DROP TABLE "template_preset" CASCADE;
DROP TABLE "uploaded_document" CASCADE;
DROP TYPE "public"."document_status";
DROP TYPE "public"."grade_level";
DROP TYPE "public"."safety_event_type";
DROP TYPE "public"."safety_severity";
        `);
  
  };
  