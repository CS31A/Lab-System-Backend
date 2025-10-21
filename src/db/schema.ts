import { z } from '@hono/zod-openapi'
import { relations } from 'drizzle-orm'
import { boolean, index, pgTable, timestamp, uniqueIndex, varchar } from 'drizzle-orm/pg-core'
import { createSchemaFactory } from 'drizzle-zod'
import { nanoid } from 'nanoid'

export const users = pgTable('users', {
  id: varchar({ length: 12 })
    .primaryKey()
    .$default(() => nanoid(12)),
  email: varchar({ length: 255 }).notNull().unique(),
  password: varchar({ length: 255 }).notNull(),
  username: varchar({ length: 255 }).notNull().unique(),
  user_type: varchar({ length: 20 }).notNull(), // 'teacher', 'technical_staff', 'admin'
  is_deleted: boolean().default(false),
  deleted_at: timestamp({ mode: 'date' }),
  created_at: timestamp({ mode: 'date' }).notNull().defaultNow(),
  updated_at: timestamp({ mode: 'date' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
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
    confirm_password: z.string(),
    user_type: z.string().transform(val => val.toLowerCase()),
    username: z.string().min(8).transform(val => val.toLowerCase()),
    firstname: z.preprocess(val => val === '' ? undefined : val, z.string().min(1).optional()),
    lastname: z.preprocess(val => val === '' ? undefined : val, z.string().min(1).optional()),
  })
  .refine(data => data.password === data.confirm_password, {
    error: 'Passwords don\'t match',
  })

export const patchUserSchema = z.object({
  // Email - only validate format when provided
  email: z.string()
    .optional()
    .refine(
      val => !val || val === '' || z.string().email().safeParse(val).success,
      { message: 'Invalid email address' },
    )
    .transform(val => val === '' ? undefined : val),

  // Password - only validate strength when provided
  password: z.string()
    .optional()
    .refine(
      val => !val || val === '' || (val.length >= 8 && /^(?=.*[A-Z])(?=.*\d)/i.test(val)),
      { message: 'Password must be at least 8 characters with at least one uppercase letter and one number' },
    )
    .transform(val => val === '' ? undefined : val),

  // Username - only validate length and transform when provided
  username: z.string()
    .optional()
    .refine(
      val => !val || val === '' || val.length >= 8,
      { message: 'Username must be at least 8 characters' },
    )
    .transform(val => val === '' ? undefined : val?.toLowerCase()),

  // User type - transform to lowercase when provided
  user_type: z.string()
    .optional()
    .transform(val => val === '' ? undefined : val?.toLowerCase()),

  // First name - validate when provided
  firstname: z.string()
    .optional()
    .refine(
      val => !val || val === '' || val.length >= 1,
      { message: 'First name cannot be empty' },
    )
    .transform(val => val === '' ? undefined : val),

  // Last name - validate when provided
  lastname: z.string()
    .optional()
    .refine(
      val => !val || val === '' || val.length >= 1,
      { message: 'Last name cannot be empty' },
    )
    .transform(val => val === '' ? undefined : val),

  // Confirm password - for password updates
  confirm_password: z.string()
    .optional()
    .transform(val => val === '' ? undefined : val),
})
  .refine(
    (data) => {
      // Only check password confirmation if both password and confirmPassword are provided
      if (data.password && data.confirm_password) {
        return data.password === data.confirm_password
      }
      return true
    },
    {
      message: 'Passwords don\'t match',
      path: ['confirmPassword'], // Error will be attached to confirmPassword field
    },
  )

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
  created_at: timestamp({ mode: 'date' }).notNull().defaultNow(),
  updated_at: timestamp({ mode: 'date' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
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
  created_at: timestamp({ mode: 'date' }).notNull().defaultNow(),
  updated_at: timestamp({ mode: 'date' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
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
  created_at: timestamp({ mode: 'date' }).notNull().defaultNow(),
  updated_at: timestamp({ mode: 'date' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
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
  name: varchar({ length: 128 }).notNull().unique(),
  status: boolean().default(true).notNull(),
  created_at: timestamp({ mode: 'date' }).notNull().defaultNow(),
  updated_at: timestamp({ mode: 'date' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

export const laboratorySelectSchema = createSelectSchema(laboratory)

export const laboratoryInsertSchema = createInsertSchema(laboratory)
  .required({
    name: true,
  })
  .omit({
    id: true,
    created_at: true,
    updated_at: true,
  })

export const patchLaboratorySchema = createInsertSchema(laboratory).partial().omit({
  id: true,
  created_at: true,
  updated_at: true,
})

export const students = pgTable('students', {
  id: varchar({ length: 12 })
    .primaryKey()
    .$default(() => nanoid(12)),
  firstname: varchar({ length: 100 }).notNull(),
  lastname: varchar({ length: 100 }).notNull(),
  student_id: varchar({ length: 50 }).notNull().unique(),
  section: varchar({ length: 30 }).notNull(),
  course: varchar({ length: 50 }).notNull(),
  created_at: timestamp({ mode: 'date' }).notNull().defaultNow(),
  updated_at: timestamp({ mode: 'date' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
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
  created_at: timestamp({ mode: 'date' }).notNull().defaultNow(),
  updated_at: timestamp({ mode: 'date' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

export const subjectSelectSchema = createSelectSchema(subjects)

export const subjectInsertSchema = createInsertSchema(subjects)
  .required({
    subject_name: true,
    subject_code: true,
  })
  .omit({
    id: true,
    created_at: true,
    updated_at: true,
  })

export const patchSubjectSchema = z.object({
  subject_name: z.string().optional(),
  subject_code: z.string().optional(),
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
  start_time: timestamp({ mode: 'date' }).notNull(),
  end_time: timestamp({ mode: 'date' }).notNull(),
  status: varchar({ length: 20 }).default('scheduled'),
  created_at: timestamp({ mode: 'date' }).notNull().defaultNow(),
  updated_at: timestamp({ mode: 'date' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
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
  created_at: timestamp({ mode: 'date' }).notNull().defaultNow(),
  updated_at: timestamp({ mode: 'date' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
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
  created_at: timestamp({ mode: 'date' }).notNull().defaultNow(),
  updated_at: timestamp({ mode: 'date' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
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
  schedule_id: varchar({ length: 12 })
    .references(() => schedule.id),
  seating_id: varchar({ length: 12 })
    .references(() => seating_history.id),
  status: varchar({ length: 50 })
    .notNull(),
  time_in: timestamp({ mode: 'date' }),
  time_out: timestamp({ mode: 'date' }),
  created_at: timestamp({ mode: 'date' })
    .notNull()
    .defaultNow(),
  updated_at: timestamp({ mode: 'date' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
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

export const refreshTokens = pgTable('refresh_tokens', {
  id: varchar({ length: 12 })
    .primaryKey()
    .$default(() => nanoid(12)),
  user_id: varchar('user_id', { length: 12 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  selector: varchar('selector', { length: 12 })
    .notNull()
    .unique(), // Unique constraint on selector for O(1) lookups
  token_hash: varchar('token_hash', { length: 255 })
    .notNull(), // Removed unique constraint - hash of verifier part only
  expires_at: timestamp('expires_at', { mode: 'date' })
    .notNull(),
  created_at: timestamp({ mode: 'date' })
    .notNull()
    .defaultNow(),
  updated_at: timestamp({ mode: 'date' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
}, table => ({
  selectorIdx: uniqueIndex('refresh_tokens_selector_idx').on(table.selector),
  expiresAtIdx: index('refresh_tokens_expires_at_idx').on(table.expires_at),
}))

export const refreshTokenSelectSchema = createSelectSchema(refreshTokens)
export const refreshTokenInsertSchema = createInsertSchema(refreshTokens)
  .omit({ id: true, createdAt: true, updatedAt: true })

// Define relations for users and refresh tokens
export const usersRelations = relations(users, ({ many }) => ({
  refreshTokens: many(refreshTokens),
}))

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, {
    fields: [refreshTokens.user_id],
    references: [users.id],
  }),
}))

// Password Reset Tokens Table
export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: varchar({ length: 12 })
    .primaryKey()
    .$default(() => nanoid(12)),
  user_id: varchar('user_id', { length: 12 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  selector: varchar('selector', { length: 12 })
    .notNull()
    .unique(), // Public part for O(1) lookups
  token_hash: varchar('token_hash', { length: 255 })
    .notNull(), // Hash of the secret verifier part
  expires_at: timestamp('expires_at', { mode: 'date' })
    .notNull(),
  used_at: timestamp('used_at', { mode: 'date' }), // Track when token was used
  created_at: timestamp({ mode: 'date' })
    .notNull()
    .defaultNow(),
}, table => ({
  selectorIdx: uniqueIndex('password_reset_tokens_selector_idx').on(table.selector),
  expiresAtIdx: index('password_reset_tokens_expires_at_idx').on(table.expires_at),
  userIdIdx: index('password_reset_tokens_user_id_idx').on(table.user_id),
}))

export const passwordResetTokenSelectSchema = createSelectSchema(passwordResetTokens)
export const passwordResetTokenInsertSchema = createInsertSchema(passwordResetTokens)
  .omit({ id: true, created_at: true, used_at: true })

// Relations for password reset tokens
export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, {
    fields: [passwordResetTokens.user_id],
    references: [users.id],
  }),
}))

// Update users relations to include password reset tokens
export const usersRelationsUpdated = relations(users, ({ many }) => ({
  refreshTokens: many(refreshTokens),
  passwordResetTokens: many(passwordResetTokens),
}))
