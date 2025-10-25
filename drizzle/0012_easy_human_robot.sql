ALTER TABLE "students" ADD COLUMN "is_deleted" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "deleted_at" timestamp;