import { z } from '@hono/zod-openapi'
import { sql } from 'drizzle-orm'
import { boolean, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core'
import { createSchemaFactory } from 'drizzle-zod'
import { nanoid } from 'nanoid'

// const customId = (length = 12): string => {
//   const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
//   let result = ''
//   for (let i = 0; i < length; i++) result += chars.charAt(Math.floor(Math.random() * chars.length))
//   return result
// }

export const users = pgTable('users', {
  id: varchar({ length: 12 })
    .primaryKey()
    .$default(() => nanoid(12)),
  email: varchar({ length: 255 }).notNull().unique(),
  password: varchar({ length: 255 }).notNull(),
  username: varchar({ length: 255 }).notNull().unique(),
  user_type: varchar({ length: 20 }).notNull(), // 'teacher', 'technical_staff', 'admin'
  created_at: timestamp().notNull().defaultNow(),
  updated_at: timestamp()
    .notNull()
    .defaultNow()
    .$onUpdate(() => sql`NOW()`),
})

const { createSelectSchema, createInsertSchema } = createSchemaFactory({
  zodInstance: z,
})

export const userSelectSchema = createSelectSchema(users)

export const userInsertSchema = createInsertSchema(users, {
  username: (schema: any) => schema.openapi({ example: 'JohnDoeSuper12' }),
})
  .required({
    password: true,
    username: true,
    user_type: true,
    email: true,
  })
  .omit({
    id: true,
    created_at: true,
    updated_at: true,
  })
  .extend({
    email: z.email(),
    password: z
      .string()
      .min(8)
      .regex(/^(?=.*[A-Z])(?=.*\d)/i),
    confirmPassword: z.string(),
    // firstname: z.string().min(1, 'First name is required'),
    // lastname: z.string().min(1, 'Last name is required'),
  })
  .refine(data => data.password === data.confirmPassword, {
    error: 'Passwords don\'t match',
  })

export const patchUserSchema = userInsertSchema.partial()

export const teachers = pgTable('teachers', {
  id: varchar({ length: 12 })
    .primaryKey()
    .$default(() => nanoid(12)),
  user_id: varchar({ length: 12 })
    .notNull()
    .references(() => users.id),
  firstname: varchar({ length: 100 }),
  lastname: varchar({ length: 100 }),
  attendance: varchar({ length: 20 }).notNull().default('present'),
  created_at: timestamp().notNull().defaultNow(),
  updated_at: timestamp()
    .notNull()
    .defaultNow()
    .$onUpdate(() => sql`NOW()`),
})

export const teacherSelectSchema = createSelectSchema(teachers)

export const teacherInsertSchema = createInsertSchema(teachers)
  .required({
    // firstname: true,
    // lastname: true,
    user_id: true,
  })
  .omit({
    id: true,
    created_at: true,
    updated_at: true,
  })

export const patchTeacherSchema = createInsertSchema(teachers).partial()

export const technical_staff = pgTable('technical_staff', {
  id: varchar({ length: 12 })
    .primaryKey()
    .$default(() => nanoid(12)),
  user_id: varchar({ length: 12 })
    .notNull()
    .references(() => users.id),
  firstname: varchar({ length: 100 }),
  lastname: varchar({ length: 100 }),
  created_at: timestamp().notNull().defaultNow(),
  updated_at: timestamp()
    .notNull()
    .defaultNow()
    .$onUpdate(() => sql`NOW()`),
})

export const technicalStaffSelectSchema = createSelectSchema(technical_staff)

export const technicalStaffInsertSchema = createInsertSchema(technical_staff)
  .required({
    user_id: true,
    // firstname: true,
    // lastname: true,
  })
  .omit({
    id: true,
    created_at: true,
    updated_at: true,
  })

export const patchTechnicalStaffSchema
  = createInsertSchema(technical_staff).partial()

export const admins = pgTable('admins', {
  id: varchar({ length: 12 })
    .primaryKey()
    .$default(() => nanoid(12)),
  user_id: varchar({ length: 12 })
    .notNull()
    .references(() => users.id),
  firstname: varchar({ length: 100 }),
  lastname: varchar({ length: 100 }),
  created_at: timestamp().notNull().defaultNow(),
  updated_at: timestamp()
    .notNull()
    .defaultNow()
    .$onUpdate(() => sql`NOW()`),
})

export const adminSelectSchema = createSelectSchema(admins)

export const adminInsertSchema = createInsertSchema(admins)
  .required({
    user_id: true,
    // firstname: true,
    // lastname: true,
  })
  .omit({
    id: true,
    created_at: true,
    updated_at: true,
  })

export const patchAdminSchema = createInsertSchema(admins).partial()

export const laboratory = pgTable('laboratory', {
  id: varchar({ length: 12 })
    .primaryKey()
    .$default(() => nanoid(12)),
  name: varchar({ length: 128 }).notNull(),
  status: boolean().default(true),
  time_in: timestamp(),
  time_out: timestamp(),
  created_at: timestamp().notNull().defaultNow(),
  updated_at: timestamp()
    .notNull()
    .defaultNow()
    .$onUpdate(() => sql`NOW()`),
})

export const laboratorySelectSchema = createSelectSchema(laboratory)

export const laboratoryInsertSchema = createInsertSchema(laboratory)
  .required({
    name: true,
    time_in: true,
    time_out: true,
  })
  .omit({
    id: true,
    created_at: true,
    updated_at: true,
  })

export const patchLaboratorySchema = createInsertSchema(laboratory).partial()

export const students = pgTable('students', {
  id: varchar({ length: 12 })
    .primaryKey()
    .$default(() => nanoid(12)),
  firstname: varchar({ length: 100 }).notNull(),
  lastname: varchar({ length: 100 }).notNull(),
  student_id: varchar({ length: 50 }).notNull().unique(),
  section: varchar({ length: 30 }).notNull(),
  course: varchar({ length: 50 }).notNull(),
  created_at: timestamp().notNull().defaultNow(),
  updated_at: timestamp()
    .notNull()
    .defaultNow()
    .$onUpdate(() => sql`NOW()`),
})

export const studentSelectSchema = createSelectSchema(students)

export const studentInsertSchema = createInsertSchema(students)
  .required({
    firstname: true,
    lastname: true,
    student_id: true,
  })
  .omit({
    id: true,
    created_at: true,
    updated_at: true,
  })

export const patchStudentSchema = createInsertSchema(students).partial()

export const subjects = pgTable('subjects', {
  id: varchar({ length: 12 }).primaryKey().$default(() => nanoid(12)),
  subject_name: varchar({ length: 255 }).notNull(),
  subject_code: varchar({ length: 50 }).notNull(),
  created_at: timestamp().notNull().defaultNow(),
  updated_at: timestamp()
    .notNull()
    .defaultNow()
    .$onUpdate(() => sql`NOW()`),
})

export const schedule = pgTable('schedule', {
  id: varchar({ length: 12 })
    .primaryKey()
    .$default(() => nanoid(12)),
  laboratory_id: varchar({ length: 12 })
    .notNull()
    .references(() => laboratory.id),
  teacher_id: varchar({ length: 12 })
    .notNull()
    .references(() => teachers.id),
  subject_id: varchar({ length: 12 }).notNull().references(() => subjects.id),
  section: varchar({ length: 30 }).notNull(),
  start_time: timestamp().notNull(),
  end_time: timestamp().notNull(),
  status: varchar({ length: 20 }).default('scheduled'),
  created_at: timestamp().notNull().defaultNow(),
  updated_at: timestamp()
    .notNull()
    .defaultNow()
    .$onUpdate(() => sql`NOW()`),
})

export const scheduleSelectSchema = createSelectSchema(schedule)

export const scheduleInsertSchema = createInsertSchema(schedule)
  .required({
    laboratory_id: true,
    teacher_id: true,
    subject_id: true,
    section: true,
    start_time: true,
    end_time: true,
  })
  .omit({
    id: true,
    created_at: true,
    updated_at: true,
  })

export const patchScheduleSchema = createInsertSchema(schedule).partial()

export const seating_plan = pgTable('seating_plan', {
  id: varchar({ length: 12 })
    .primaryKey()
    .$default(() => nanoid(12)),
  laboratory_id: varchar({ length: 12 })
    .notNull()
    .references(() => laboratory.id),
  schedule_id: varchar({ length: 12 })
    .notNull()
    .references(() => schedule.id),
  student_id: varchar({ length: 12 })
    .notNull()
    .references(() => students.id),
  seat_number: varchar({ length: 10 }).notNull(),
  monitor_status: varchar({ length: 255 }).notNull(), // 'Good condition', 'Defective', 'Missing'
  mouse_status: varchar({ length: 255 }).notNull(),
  keyboard_status: varchar({ length: 255 }).notNull(),
  cables_status: varchar({ length: 255 }).notNull(),
  created_at: timestamp().notNull().defaultNow(),
  updated_at: timestamp()
    .notNull()
    .defaultNow()
    .$onUpdate(() => sql`NOW()`),
})

export const seatingPlanSelectSchema = createSelectSchema(seating_plan)

export const seatingPlanInsertSchema = createInsertSchema(seating_plan)
  .required({
    laboratory_id: true,
    schedule_id: true,
    student_id: true,
    seat_number: true,
  })
  .omit({
    id: true,
    created_at: true,
    updated_at: true,
  })

export const patchSeatingPlanSchema
  = createInsertSchema(seating_plan).partial()

export const seating_history = pgTable('seating_history', {
  id: varchar({ length: 12 })
    .primaryKey()
    .$default(() => nanoid(12)),
  laboratory_id: varchar({ length: 12 })
    .notNull()
    .references(() => laboratory.id),
  student_id: varchar({ length: 12 })
    .notNull()
    .references(() => students.id),
  seating_id: varchar({ length: 12 }).notNull().references(() => seating_plan.id),
  // seat_number: varchar({ length: 10 }).notNull(), Uncomment this and remove seating_id depende sa design
  // session_date: timestamp().notNull(),
  monitor: varchar({ length: 255 }).notNull(),
  mouse: varchar({ length: 255 }).notNull(),
  keyboard: varchar({ length: 255 }).notNull(),
  cables: varchar({ length: 255 }).notNull(),
  created_at: timestamp().notNull().defaultNow(),
  updated_at: timestamp()
    .notNull()
    .defaultNow()
    .$onUpdate(() => sql`NOW()`),
})

export const seatingHistorySelectSchema = createSelectSchema(seating_history)

export const seatingHistoryInsertSchema = createInsertSchema(seating_history)
  .required({
    laboratory_id: true,
    student_id: true,
    // seat_number
    seating_id: true,
    // session_date: true,
  })
  .omit({
    id: true,
    created_at: true,
    updated_at: true,
  })

export const patchSeatingHistorySchema
  = createInsertSchema(seating_history).partial()

export const lab_activity_log = pgTable('lab_activity_log', {
  id: varchar({ length: 12 })
    .primaryKey()
    .$default(() => nanoid(12)),
  laboratory_id: varchar({ length: 12 })
    .notNull()
    .references(() => laboratory.id),
  schedule_id: varchar({ length: 12 }).references(() => schedule.id),
  seating_id: varchar({ length: 12 }).references(() => seating_history.id),
  status: varchar({ length: 50 }).notNull(),
  time_in: timestamp(),
  time_out: timestamp(),
  created_at: timestamp().notNull().defaultNow(),
  updated_at: timestamp()
    .notNull()
    .defaultNow()
    .$onUpdate(() => sql`NOW()`),
})

export const labActivityLogSelectSchema = createSelectSchema(lab_activity_log)

export const labActivityLogInsertSchema = createInsertSchema(lab_activity_log)
  .required({
    laboratory_id: true,
    schedule_id: true,
    seating_id: true,
    time_in: true,
    time_out: true,
  })
  .omit({
    id: true,
    created_at: true,
    updated_at: true,
    timestamp: true,
  })

export const patchLabActivityLogSchema
  = createInsertSchema(lab_activity_log).partial()
