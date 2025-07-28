CREATE TABLE "admins" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"id" varchar(12) PRIMARY KEY NOT NULL,
	"user_id" varchar(12) NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "laboratory" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"id" varchar(12) PRIMARY KEY NOT NULL,
	"name" varchar(128) NOT NULL,
	"status" boolean DEFAULT true,
	"time_in" timestamp,
	"time_out" timestamp
);
--> statement-breakpoint
CREATE TABLE "technical_staff" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"id" varchar(12) PRIMARY KEY NOT NULL,
	"user_id" varchar(12) NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admins" ADD CONSTRAINT "admins_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "technical_staff" ADD CONSTRAINT "technical_staff_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;