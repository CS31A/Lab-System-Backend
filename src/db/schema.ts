import { int, mysqlTable, serial, varchar, timestamp } from 'drizzle-orm/mysql-core';
import { createSelectSchema } from 'drizzle-zod';

export const users = mysqlTable('users', {
  id: int().primaryKey().autoincrement(),
  email: varchar({ length: 255 }).notNull().unique(),
  password_hash: varchar({ length: 255 }).notNull(),
  first_name: varchar({ length: 100 }).notNull(),
  last_name: varchar({ length: 100 }).notNull(),
  user_type: varchar({ length: 20 }).notNull(), // 'teacher', 'technical_staff', 'admin'
  created_at: timestamp().notNull().defaultNow(),
  updated_at: timestamp().notNull().defaultNow().onUpdateNow(),
});

export const userSelectSchema = createSelectSchema(users)