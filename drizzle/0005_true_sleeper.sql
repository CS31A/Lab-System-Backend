ALTER TABLE "seating_plan" RENAME COLUMN "monitor" TO "monitor_status";--> statement-breakpoint
ALTER TABLE "seating_plan" RENAME COLUMN "mouse" TO "mouse_status";--> statement-breakpoint
ALTER TABLE "seating_plan" RENAME COLUMN "keyboard" TO "keyboard_status";--> statement-breakpoint
ALTER TABLE "seating_plan" RENAME COLUMN "cables" TO "cables_status";--> statement-breakpoint
ALTER TABLE "admins" ALTER COLUMN "firstname" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "admins" ALTER COLUMN "lastname" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "teachers" ALTER COLUMN "firstname" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "teachers" ALTER COLUMN "lastname" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "technical_staff" ALTER COLUMN "firstname" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "technical_staff" ALTER COLUMN "lastname" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "course" varchar(50) NOT NULL;