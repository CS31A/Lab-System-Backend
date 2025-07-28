CREATE TABLE "teachers" (
	"id" varchar(12) PRIMARY KEY NOT NULL,
	"user_id" varchar(12) NOT NULL,
	"attendance" varchar(20) DEFAULT 'present' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;