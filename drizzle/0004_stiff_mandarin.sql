CREATE TABLE "lab_activity_log" (
	"id" varchar(12) PRIMARY KEY NOT NULL,
	"laboratory_id" varchar(12) NOT NULL,
	"schedule_id" varchar(12),
	"seating_id" varchar(12),
	"status" varchar(50) NOT NULL,
	"time_in" timestamp,
	"time_out" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "schedule" (
	"id" varchar(12) PRIMARY KEY NOT NULL,
	"laboratory_id" varchar(12) NOT NULL,
	"teacher_id" varchar(12) NOT NULL,
	"subject_id" varchar(12) NOT NULL,
	"section" varchar(30) NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"status" varchar(20) DEFAULT 'scheduled',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seating_history" (
	"id" varchar(12) PRIMARY KEY NOT NULL,
	"laboratory_id" varchar(12) NOT NULL,
	"student_id" varchar(12) NOT NULL,
	"seating_id" varchar(12) NOT NULL,
	"monitor" varchar(255) NOT NULL,
	"mouse" varchar(255) NOT NULL,
	"keyboard" varchar(255) NOT NULL,
	"cables" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seating_plan" (
	"id" varchar(12) PRIMARY KEY NOT NULL,
	"laboratory_id" varchar(12) NOT NULL,
	"schedule_id" varchar(12) NOT NULL,
	"student_id" varchar(12) NOT NULL,
	"seat_number" varchar(10) NOT NULL,
	"monitor" varchar(255) NOT NULL,
	"mouse" varchar(255) NOT NULL,
	"keyboard" varchar(255) NOT NULL,
	"cables" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" varchar(12) PRIMARY KEY NOT NULL,
	"firstname" varchar(100) NOT NULL,
	"lastname" varchar(100) NOT NULL,
	"student_id" varchar(50) NOT NULL,
	"section" varchar(30) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "students_student_id_unique" UNIQUE("student_id")
);
--> statement-breakpoint
CREATE TABLE "subjects" (
	"id" varchar(12) PRIMARY KEY NOT NULL,
	"subject_name" varchar(255) NOT NULL,
	"subject_code" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admins" RENAME COLUMN "first_name" TO "firstname";--> statement-breakpoint
ALTER TABLE "admins" RENAME COLUMN "last_name" TO "lastname";--> statement-breakpoint
ALTER TABLE "teachers" RENAME COLUMN "first_name" TO "firstname";--> statement-breakpoint
ALTER TABLE "teachers" RENAME COLUMN "last_name" TO "lastname";--> statement-breakpoint
ALTER TABLE "technical_staff" RENAME COLUMN "first_name" TO "firstname";--> statement-breakpoint
ALTER TABLE "technical_staff" RENAME COLUMN "last_name" TO "lastname";--> statement-breakpoint
ALTER TABLE "lab_activity_log" ADD CONSTRAINT "lab_activity_log_laboratory_id_laboratory_id_fk" FOREIGN KEY ("laboratory_id") REFERENCES "public"."laboratory"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_activity_log" ADD CONSTRAINT "lab_activity_log_schedule_id_schedule_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."schedule"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_activity_log" ADD CONSTRAINT "lab_activity_log_seating_id_seating_history_id_fk" FOREIGN KEY ("seating_id") REFERENCES "public"."seating_history"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule" ADD CONSTRAINT "schedule_laboratory_id_laboratory_id_fk" FOREIGN KEY ("laboratory_id") REFERENCES "public"."laboratory"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule" ADD CONSTRAINT "schedule_teacher_id_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule" ADD CONSTRAINT "schedule_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seating_history" ADD CONSTRAINT "seating_history_laboratory_id_laboratory_id_fk" FOREIGN KEY ("laboratory_id") REFERENCES "public"."laboratory"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seating_history" ADD CONSTRAINT "seating_history_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seating_history" ADD CONSTRAINT "seating_history_seating_id_seating_plan_id_fk" FOREIGN KEY ("seating_id") REFERENCES "public"."seating_plan"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seating_plan" ADD CONSTRAINT "seating_plan_laboratory_id_laboratory_id_fk" FOREIGN KEY ("laboratory_id") REFERENCES "public"."laboratory"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seating_plan" ADD CONSTRAINT "seating_plan_schedule_id_schedule_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."schedule"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seating_plan" ADD CONSTRAINT "seating_plan_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;