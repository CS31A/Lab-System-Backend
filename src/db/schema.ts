import { mysqlTable, varchar, timestamp } from 'drizzle-orm/mysql-core';
import { createSelectSchema } from 'drizzle-zod';
import { nanoid } from 'nanoid';

// const customId = (length = 12): string => {
//   const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
//   let result = ''
//   for (let i = 0; i < length; i++) result += chars.charAt(Math.floor(Math.random() * chars.length))
//   return result
// }

export const users = mysqlTable('users', {
  id: varchar({ length: 12 }).primaryKey().$default(() => nanoid(12)),
  email: varchar({ length: 255 }).notNull().unique(),
  password_hash: varchar({ length: 255 }).notNull(),
  first_name: varchar({ length: 100 }).notNull(),
  last_name: varchar({ length: 100 }).notNull(),
  user_type: varchar({ length: 20 }).notNull(), // 'teacher', 'technical_staff', 'admin'
  created_at: timestamp().notNull().defaultNow(),
  updated_at: timestamp().notNull().defaultNow().onUpdateNow(),
});

export const userSelectSchema = createSelectSchema(users)