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
  created_at: timestamp().notNull().defaultNow(),
  updated_at: timestamp().notNull().defaultNow().$onUpdate(() => sql`NOW()`),
  id: varchar({ length: 12 }).primaryKey().$default(() => nanoid(12)),
  email: varchar({ length: 255 }).notNull().unique(),
  password: varchar({ length: 255 }).notNull(),
  username: varchar({ length: 255 }).notNull().unique(),
  user_type: varchar({ length: 20 }).notNull(), // 'teacher', 'technical_staff', 'admin'
})

const {
  createSelectSchema,
  createInsertSchema,
} = createSchemaFactory({ zodInstance: z })

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
    password: z.string().min(8).regex(/^(?=.*[A-Z])(?=.*\d)/i),
    confirmPassword: z.string(),
    // firstname: z.string().min(1, 'First name is required'),
    // lastname: z.string().min(1, 'Last name is required'),
  })
  .refine(data => data.password === data.confirmPassword, {
    error: 'Passwords don\'t match',
  })

export const patchUserSchema = userInsertSchema.partial()

export const teachers = pgTable('teachers', {
  created_at: timestamp().notNull().defaultNow(),
  updated_at: timestamp().notNull().defaultNow().$onUpdate(() => sql`NOW()`),
  id: varchar({ length: 12 }).primaryKey().$default(() => nanoid(12)),
  user_id: varchar({ length: 12 }).notNull().references(() => users.id),
  firstname: varchar({ length: 100 }).notNull(),
  lastname: varchar({ length: 100 }).notNull(),
  attendance: varchar({ length: 20 })
    .notNull()
    .default('present'),
})

export const teacherSelectSchema = createSelectSchema(teachers)

export const teacherInsertSchema = createInsertSchema(teachers)
  .required({
    firstname: true,
    lastname: true,
  })
  .omit({
    id: true,
    created_at: true,
    updated_at: true,
  })

export const patchTeacherSchema = createInsertSchema(teachers).partial()

export const technical_staff = pgTable('technical_staff', {
  created_at: timestamp().notNull().defaultNow(),
  updated_at: timestamp().notNull().defaultNow().$onUpdate(() => sql`NOW()`),
  id: varchar({ length: 12 }).primaryKey().$default(() => nanoid(12)),
  user_id: varchar({ length: 12 }).notNull().references(() => users.id),
  firstname: varchar({ length: 100 }).notNull(),
  lastname: varchar({ length: 100 }).notNull(),
})

export const technicalStaffSelectSchema = createSelectSchema(technical_staff)

export const technicalStaffInsertSchema = createInsertSchema(technical_staff)
  .required({
    firstname: true,
    lastname: true,
  })
  .omit({
    id: true,
    created_at: true,
    updated_at: true,
  })

export const patchTechnicalStaffSchema = createInsertSchema(technical_staff).partial()

export const admins = pgTable('admins', {
  created_at: timestamp().notNull().defaultNow(),
  updated_at: timestamp().notNull().defaultNow().$onUpdate(() => sql`NOW()`),
  id: varchar({ length: 12 }).primaryKey().$default(() => nanoid(12)),
  user_id: varchar({ length: 12 }).notNull().references(() => users.id),
  firstname: varchar({ length: 100 }).notNull(),
  lastname: varchar({ length: 100 }).notNull(),
})

export const adminSelectSchema = createSelectSchema(admins)

export const adminInsertSchema = createInsertSchema(admins)
  .required({
    firstname: true,
    lastname: true,
  })
  .omit({
    id: true,
    created_at: true,
    updated_at: true,
  })

export const patchAdminSchema = createInsertSchema(admins).partial()

export const laboratory = pgTable('laboratory', {
  created_at: timestamp().notNull().defaultNow(),
  updated_at: timestamp().notNull().defaultNow().$onUpdate(() => sql`NOW()`),
  id: varchar({ length: 12 }).primaryKey().$default(() => nanoid(12)),
  name: varchar({ length: 128 }).notNull(),
  status: boolean().default(true),
  time_in: timestamp(),
  time_out: timestamp(),
})
