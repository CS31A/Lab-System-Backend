import { z } from '@hono/zod-openapi'
import { pgTable, timestamp, varchar } from 'drizzle-orm/pg-core'
import { createSchemaFactory } from 'drizzle-zod'
import { nanoid } from 'nanoid'

// const customId = (length = 12): string => {
//   const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
//   let result = ''
//   for (let i = 0; i < length; i++) result += chars.charAt(Math.floor(Math.random() * chars.length))
//   return result
// }

export const users = pgTable('users', {
  id: varchar({ length: 12 }).primaryKey().$default(() => nanoid(12)),
  email: varchar({ length: 255 }).notNull().unique(),
  password: varchar({ length: 255 }).notNull(),
  first_name: varchar({ length: 100 }).notNull(),
  last_name: varchar({ length: 100 }).notNull(),
  user_type: varchar({ length: 20 }).notNull(), // 'teacher', 'technical_staff', 'admin'
  created_at: timestamp().notNull().defaultNow(),
  updated_at: timestamp().notNull().defaultNow().$onUpdateFn(() => new Date()),
})

const { createSelectSchema, createInsertSchema } = createSchemaFactory({ zodInstance: z })

export const userSelectSchema = createSelectSchema(users)

export const userInsertSchema = createInsertSchema(users, {
  first_name: (schema: any) => schema.openapi({ example: 'John' }),
})
  .required({
    password: true,
    first_name: true,
    last_name: true,
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
  })
  .refine(data => data.password === data.confirmPassword, {
    error: 'Passwords don\'t match',
  })

export const patchUserSchema = userInsertSchema.partial()
