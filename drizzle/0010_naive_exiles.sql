ALTER TABLE "laboratory" ALTER COLUMN "status" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "laboratory" DROP COLUMN "time_in";--> statement-breakpoint
ALTER TABLE "laboratory" DROP COLUMN "time_out";