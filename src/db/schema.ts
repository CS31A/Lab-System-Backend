/**
 * @fileoverview Database schema definitions for the Lab System
 * Defines all database tables, relationships, and Zod schemas for validation
 */

import { z } from '@hono/zod-openapi'
import { relations } from 'drizzle-orm'
import { boolean, index, pgTable, timestamp, uniqueIndex, varchar } from 'drizzle-orm/pg-core'
import { createSchemaFactory } from 'drizzle-zod'
import { nanoid } from 'nanoid'

/**
 * User table schema definition
 *
 * @description Defines the structure for user accounts in the system
 *
 * @property {string} id - Unique identifier for the user (auto-generated using nanoid)
 * @property {string} email - User's email address (must be unique)
 * @property {string} password - User's hashed password (required)
 * @property {string} username - User's unique username (must be unique)
 * @property {string} user_type - User's role type ('teacher', 'technical_staff', 'admin')
 * @property {boolean} is_deleted - Flag indicating if the user has been soft-deleted (default: false)
 * @property {Date} deleted_at - Timestamp when the user was soft-deleted (nullable)
 * @property {Date} created_at - Timestamp when the user was created (auto-generated)
 * @property {Date} updated_at - Timestamp when the user was last updated (auto-generated and auto-updated)
 */
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

// Create Zod schema factories for the users table
const { createSelectSchema, createInsertSchema } = createSchemaFactory({
  zodInstance: z,
})

/**
 * Zod schema for selecting user data
 *
 * @description Schema that represents the structure of user data when reading from the database
 *
 * @example
 * {
 *   id: "user123",
 *   email: "john@example.com",
 *   username: "johndoe",
 *   user_type: "teacher",
 *   is_deleted: false,
 *   created_at: "2023-01-01T00:00:00.000Z",
 *   updated_at: "2023-01-02T00:00:00.000Z"
 * }
 */
export const userSelectSchema = createSelectSchema(users)

/**
 * Zod schema for inserting new user data
 *
 * @description Schema that validates user data when creating new users
 *
 * @property {string} email - User's email address (must be a valid email format)
 * @property {string} password - User's password (minimum 8 characters, must contain uppercase and number)
 * @property {string} confirm_password - Confirmation of the password
 * @property {string} user_type - User's role type (transformed to lowercase)
 * @property {string} username - User's username (minimum 8 characters, transformed to lowercase)
 * @property {string} [firstname] - User's first name (optional, minimum 1 character)
 * @property {string} [lastname] - User's last name (optional, minimum 1 character)
 *
 * @example
 * {
 *   email: "john@example.com",
 *   password: "SecurePass123",
 *   confirm_password: "SecurePass123",
 *   user_type: "teacher",
 *   username: "johndoe",
 *   firstname: "John",
 *   lastname: "Doe"
 * }
 */
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

/**
 * Zod schema for updating user data (partial update)
 *
 * @description Schema that validates user data when updating existing users (all fields are optional)
 *
 * @property {string} [email] - User's email address (validates format when provided)
 * @property {string} [password] - User's password (validates strength when provided)
 * @property {string} [username] - User's username (validates length when provided)
 * @property {string} [user_type] - User's role type (transformed to lowercase when provided)
 * @property {string} [firstname] - User's first name (validates when provided)
 * @property {string} [lastname] - User's last name (validates when provided)
 * @property {string} [confirm_password] - Confirmation of the password (for password updates)
 *
 * @example
 * {
 *   email: "newemail@example.com",
 *   password: "NewSecurePass123",
 *   confirm_password: "NewSecurePass123"
 * }
 */
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

/**
 * Teacher table schema definition
 *
 * @description Defines the structure for teacher records in the system
 *
 * @property {string} id - Unique identifier for the teacher (auto-generated using nanoid)
 * @property {string} user_id - Reference to the associated user account (foreign key to users table)
 * @property {string} [firstname] - Teacher's first name (nullable)
 * @property {string} [lastname] - Teacher's last name (nullable)
 * @property {string} attendance - Teacher's attendance status (default: 'present')
 * @property {Date} created_at - Timestamp when the teacher record was created (auto-generated)
 * @property {Date} updated_at - Timestamp when the teacher record was last updated (auto-generated and auto-updated)
 */
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

/**
 * Zod schema for selecting teacher data
 *
 * @description Schema that represents the structure of teacher data when reading from the database
 *
 * @example
 * {
 *   id: "teacher123",
 *   user_id: "user456",
 *   firstname: "John",
 *   lastname: "Doe",
 *   attendance: "present",
 *   created_at: "2023-01-01T00:00:00.000Z",
 *   updated_at: "2023-01-02T00:00:00.000Z"
 * }
 */
export const teacherSelectSchema = createSelectSchema(teachers)

/**
 * Zod schema for inserting new teacher data
 *
 * @description Schema that validates teacher data when creating new teacher records
 *
 * @property {string} user_id - Reference to the associated user account (required)
 *
 * @example
 * {
 *   user_id: "user456"
 * }
 */
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

/**
 * Zod schema for updating teacher data (partial update)
 *
 * @description Schema that validates teacher data when updating existing teacher records (all fields are optional)
 *
 * @example
 * {
 *   firstname: "Jane",
 *   lastname: "Smith",
 *   attendance: "absent"
 * }
 */
export const patchTeacherSchema = createInsertSchema(teachers).partial()

/**
 * Technical staff table schema definition
 *
 * @description Defines the structure for technical staff records in the system
 *
 * @property {string} id - Unique identifier for the technical staff member (auto-generated using nanoid)
 * @property {string} user_id - Reference to the associated user account (foreign key to users table)
 * @property {string} [firstname] - Technical staff member's first name (nullable)
 * @property {string} [lastname] - Technical staff member's last name (nullable)
 * @property {Date} created_at - Timestamp when the technical staff record was created (auto-generated)
 * @property {Date} updated_at - Timestamp when the technical staff record was last updated (auto-generated and auto-updated)
 */
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

/**
 * Zod schema for selecting technical staff data
 *
 * @description Schema that represents the structure of technical staff data when reading from the database
 *
 * @example
 * {
 *   id: "tech123",
 *   user_id: "user456",
 *   firstname: "Jane",
 *   lastname: "Doe",
 *   created_at: "2023-01-01T00:00:00.000Z",
 *   updated_at: "2023-01-02T00:00:00.000Z"
 * }
 */
export const technicalStaffSelectSchema = createSelectSchema(technical_staff)

/**
 * Zod schema for inserting new technical staff data
 *
 * @description Schema that validates technical staff data when creating new technical staff records
 *
 * @property {string} user_id - Reference to the associated user account (required)
 *
 * @example
 * {
 *   user_id: "user456"
 * }
 */
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

/**
 * Zod schema for updating technical staff data (partial update)
 *
 * @description Schema that validates technical staff data when updating existing technical staff records (all fields are optional)
 *
 * @example
 * {
 *   firstname: "Jane",
 *   lastname: "Smith"
 * }
 */
export const patchTechnicalStaffSchema
  = createInsertSchema(technical_staff).partial()

/**
 * Admin table schema definition
 *
 * @description Defines the structure for admin records in the system
 *
 * @property {string} id - Unique identifier for the admin (auto-generated using nanoid)
 * @property {string} user_id - Reference to the associated user account (foreign key to users table)
 * @property {string} [firstname] - Admin's first name (nullable)
 * @property {string} [lastname] - Admin's last name (nullable)
 * @property {Date} created_at - Timestamp when the admin record was created (auto-generated)
 * @property {Date} updated_at - Timestamp when the admin record was last updated (auto-generated and auto-updated)
 */
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

/**
 * Zod schema for selecting admin data
 *
 * @description Schema that represents the structure of admin data when reading from the database
 *
 * @example
 * {
 *   id: "admin123",
 *   user_id: "user456",
 *   firstname: "John",
 *   lastname: "Doe",
 *   created_at: "2023-01-01T00:00:00.000Z",
 *   updated_at: "2023-01-02T00:00:00.000Z"
 * }
 */
export const adminSelectSchema = createSelectSchema(admins)

/**
 * Zod schema for inserting new admin data
 *
 * @description Schema that validates admin data when creating new admin records
 *
 * @property {string} user_id - Reference to the associated user account (required)
 *
 * @example
 * {
 *   user_id: "user456"
 * }
 */
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

/**
 * Zod schema for updating admin data (partial update)
 *
 * @description Schema that validates admin data when updating existing admin records (all fields are optional)
 *
 * @example
 * {
 *   firstname: "Jane",
 *   lastname: "Smith"
 * }
 */
export const patchAdminSchema = createInsertSchema(admins).partial()

/**
 * Laboratory table schema definition
 *
 * @description Defines the structure for laboratory records in the system
 *
 * @property {string} id - Unique identifier for the laboratory (auto-generated using nanoid)
 * @property {string} name - Name of the laboratory (must be unique)
 * @property {boolean} status - Status of the laboratory (active/inactive, default: true)
 * @property {Date} created_at - Timestamp when the laboratory was created (auto-generated)
 * @property {Date} updated_at - Timestamp when the laboratory was last updated (auto-generated and auto-updated)
 */
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

/**
 * Zod schema for selecting laboratory data
 *
 * @description Schema that represents the structure of laboratory data when reading from the database
 *
 * @example
 * {
 *   id: "lab123",
 *   name: "Computer Lab 1",
 *   status: true,
 *   created_at: "2023-01-01T00:00:00.000Z",
 *   updated_at: "2023-01-02T00:00:00.000Z"
 * }
 */
export const laboratorySelectSchema = createSelectSchema(laboratory)

/**
 * Zod schema for inserting new laboratory data
 *
 * @description Schema that validates laboratory data when creating new laboratory records
 *
 * @property {string} name - Name of the laboratory (required)
 *
 * @example
 * {
 *   name: "Computer Lab 1"
 * }
 */
export const laboratoryInsertSchema = createInsertSchema(laboratory)
  .required({
    name: true,
  })
  .omit({
    id: true,
    created_at: true,
    updated_at: true,
  })

/**
 * Zod schema for updating laboratory data (partial update)
 *
 * @description Schema that validates laboratory data when updating existing laboratory records (all fields are optional)
 *
 * @example
 * {
 *   name: "Computer Lab 2",
 *   status: false
 * }
 */
export const patchLaboratorySchema = createInsertSchema(laboratory).partial().omit({
  id: true,
  created_at: true,
  updated_at: true,
})

/**
 * Student table schema definition
 *
 * @description Defines the structure for student records in the system
 *
 * @property {string} id - Unique identifier for the student (auto-generated using nanoid)
 * @property {string} firstname - Student's first name
 * @property {string} lastname - Student's last name
 * @property {string} student_id - Unique student identification number
 * @property {string} section - Student's class section
 * @property {string} course - Student's course/program
 * @property {boolean} is_deleted - Flag indicating if the student has been soft-deleted (default: false)
 * @property {Date} deleted_at - Timestamp when the student was soft-deleted (nullable)
 * @property {Date} created_at - Timestamp when the student was created (auto-generated)
 * @property {Date} updated_at - Timestamp when the student was last updated (auto-generated and auto-updated)
 */
export const students = pgTable('students', {
  id: varchar({ length: 12 })
    .primaryKey()
    .$default(() => nanoid(12)),
  firstname: varchar({ length: 100 }).notNull(),
  lastname: varchar({ length: 100 }).notNull(),
  student_id: varchar({ length: 50 }).notNull().unique(),
  section: varchar({ length: 30 }).notNull(),
  course: varchar({ length: 50 }).notNull(),
  is_deleted: boolean().default(false),
  deleted_at: timestamp({ mode: 'date' }),
  created_at: timestamp({ mode: 'date' }).notNull().defaultNow(),
  updated_at: timestamp({ mode: 'date' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

/**
 * Zod schema for selecting student data
 *
 * @description Schema that represents the structure of student data when reading from the database
 *
 * @example
 * {
 *   id: "student123",
 *   firstname: "John",
 *   lastname: "Doe",
 *   student_id: "S12345678",
 *   section: "CS101-A",
 *   course: "Computer Science",
 *   is_deleted: false,
 *   deleted_at: null,
 *   created_at: "2023-01-01T00:00:00.00Z",
 *   updated_at: "2023-01-02T00:00:00.000Z"
 * }
 */
export const studentSelectSchema = createSelectSchema(students)

/**
 * Zod schema for inserting new student data
 *
 * @description Schema that validates student data when creating new student records
 *
 * @property {string} firstname - Student's first name (required)
 * @property {string} lastname - Student's last name (required)
 * @property {string} student_id - Unique student identification number (required)
 *
 * @example
 * {
 *   firstname: "John",
 *   lastname: "Doe",
 *   student_id: "S12345678"
 * }
 */
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

/**
 * Zod schema for updating student data (partial update)
 *
 * @description Schema that validates student data when updating existing student records (all fields are optional)
 *
 * @example
 * {
 *   firstname: "Jane",
 *   lastname: "Smith",
 *   section: "CS101-B"
 * }
 */
export const patchStudentSchema = createInsertSchema(students).partial()

/**
 * Subject table schema definition
 *
 * @description Defines the structure for subject records in the system
 *
 * @property {string} id - Unique identifier for the subject (auto-generated using nanoid)
 * @property {string} subject_name - Name of the subject
 * @property {string} subject_code - Code of the subject
 * @property {Date} created_at - Timestamp when the subject was created (auto-generated)
 * @property {Date} updated_at - Timestamp when the subject was last updated (auto-generated and auto-updated)
 */
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

/**
 * Zod schema for selecting subject data
 *
 * @description Schema that represents the structure of subject data when reading from the database
 *
 * @example
 * {
 *   id: "subj123",
 *   subject_name: "Introduction to Computer Science",
 *   subject_code: "CS101",
 *   created_at: "2023-01-01T00:00:00.00Z",
 *   updated_at: "2023-01-02T00:0:00.000Z"
 * }
 */
export const subjectSelectSchema = createSelectSchema(subjects)

/**
 * Zod schema for inserting new subject data
 *
 * @description Schema that validates subject data when creating new subject records
 *
 * @property {string} subject_name - Name of the subject (required)
 * @property {string} subject_code - Code of the subject (required)
 *
 * @example
 * {
 *   subject_name: "Introduction to Computer Science",
 *   subject_code: "CS101"
 * }
 */
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

/**
 * Zod schema for updating subject data (partial update)
 *
 * @description Schema that validates subject data when updating existing subject records (all fields are optional)
 *
 * @property {string} [subject_name] - Name of the subject (optional)
 * @property {string} [subject_code] - Code of the subject (optional)
 *
 * @example
 * {
 *   subject_name: "Advanced Computer Science",
 *   subject_code: "CS201"
 * }
 */
export const patchSubjectSchema = z.object({
  subject_name: z.string().optional(),
  subject_code: z.string().optional(),
})

/**
 * Schedule table schema definition
 *
 * @description Defines the structure for class schedule records in the system
 *
 * @property {string} id - Unique identifier for the schedule (auto-generated using nanoid)
 * @property {string} laboratory_id - Reference to the associated laboratory (foreign key to laboratory table)
 * @property {string} teacher_id - Reference to the associated teacher (foreign key to teachers table)
 * @property {string} subject_id - Reference to the associated subject (foreign key to subjects table)
 * @property {string} section - Class section for the schedule
 * @property {Date} start_time - Start time of the schedule
 * @property {Date} end_time - End time of the schedule
 * @property {string} status - Status of the schedule (default: 'scheduled')
 * @property {Date} created_at - Timestamp when the schedule was created (auto-generated)
 * @property {Date} updated_at - Timestamp when the schedule was last updated (auto-generated and auto-updated)
 */
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

/**
 * Zod schema for selecting schedule data
 *
 * @description Schema that represents the structure of schedule data when reading from the database
 *
 * @example
 * {
 *   id: "sched123",
 *   laboratory_id: "lab456",
 *   teacher_id: "teacher789",
 *   subject_id: "subj101",
 *   section: "CS101-A",
 *   start_time: "2023-01-01T08:00:00.000Z",
 *   end_time: "2023-01-01T10:00:00.000Z",
 *   status: "scheduled",
 *   created_at: "2023-01-01T00:00:00.000Z",
 *   updated_at: "2023-01-02T00:00:00.000Z"
 * }
 */
export const scheduleSelectSchema = createSelectSchema(schedule)

/**
 * Zod schema for inserting new schedule data
 *
 * @description Schema that validates schedule data when creating new schedule records
 * Accepts ISO date strings for start_time and end_time and coerces them to Date objects
 *
 * @property {string} laboratory_id - Reference to the associated laboratory (required)
 * @property {string} teacher_id - Reference to the associated teacher (required)
 * @property {string} subject_id - Reference to the associated subject (required)
 * @property {string} section - Class section for the schedule (required)
 * @property {Date|string} start_time - Start time of the schedule (accepts ISO date string, required)
 * @property {Date|string} end_time - End time of the schedule (accepts ISO date string, required)
 *
 * @example
 * {
 *   laboratory_id: "lab456",
 *   teacher_id: "teacher789",
 *   subject_id: "subj101",
 *   section: "CS101-A",
 *   start_time: "2023-01-01T08:00:00.000Z",
 *   end_time: "2023-01-01T10:00:00.000Z"
 * }
 */
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
  .extend({
    start_time: z.coerce.date(),
    end_time: z.coerce.date(),
  })

/**
 * Zod schema for updating schedule data (partial update)
 *
 * @description Schema that validates schedule data when updating existing schedule records (all fields are optional)
 * Accepts ISO date strings for start_time and end_time and coerces them to Date objects
 *
 * @example
 * {
 *   section: "CS101-B",
 *   start_time: "2023-01-01T09:00:00.000Z",
 *   end_time: "2023-01-01T11:00:00.000Z",
 *   status: "rescheduled"
 * }
 */
export const patchScheduleSchema = createInsertSchema(schedule)
  .partial()
  .extend({
    start_time: z.coerce.date().optional(),
    end_time: z.coerce.date().optional(),
  })

/**
 * Seating plan table schema definition
 *
 * @description Defines the structure for seating plan records in the system
 *
 * @property {string} id - Unique identifier for the seating plan (auto-generated using nanoid)
 * @property {string} laboratory_id - Reference to the associated laboratory (foreign key to laboratory table)
 * @property {string} schedule_id - Reference to the associated schedule (foreign key to schedule table)
 * @property {string} student_id - Reference to the associated student (foreign key to students table)
 * @property {string} seat_number - Seat number in the laboratory
 * @property {string} monitor_status - Status of the monitor (e.g., 'Good condition', 'Defective', 'Missing')
 * @property {string} mouse_status - Status of the mouse
 * @property {string} keyboard_status - Status of the keyboard
 * @property {string} cables_status - Status of the cables
 * @property {Date} created_at - Timestamp when the seating plan was created (auto-generated)
 * @property {Date} updated_at - Timestamp when the seating plan was last updated (auto-generated and auto-updated)
 */
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

/**
 * Zod schema for selecting seating plan data
 *
 * @description Schema that represents the structure of seating plan data when reading from the database
 *
 * @example
 * {
 *   id: "seat123",
 *   laboratory_id: "lab456",
 *   schedule_id: "sched789",
 *   student_id: "student101",
 *   seat_number: "A1",
 *   monitor_status: "Good condition",
 *   mouse_status: "Good condition",
 *   keyboard_status: "Defective",
 *   cables_status: "Good condition",
 *   created_at: "2023-01-01T00:00:00.000Z",
 *   updated_at: "2023-01-02T00:00:00.000Z"
 * }
 */
export const seatingPlanSelectSchema = createSelectSchema(seating_plan)

/**
 * Zod schema for inserting new seating plan data
 *
 * @description Schema that validates seating plan data when creating new seating plan records
 *
 * @property {string} laboratory_id - Reference to the associated laboratory (required)
 * @property {string} schedule_id - Reference to the associated schedule (required)
 * @property {string} student_id - Reference to the associated student (required)
 * @property {string} seat_number - Seat number in the laboratory (required)
 *
 * @example
 * {
 *   laboratory_id: "lab456",
 *   schedule_id: "sched789",
 *   student_id: "student101",
 *   seat_number: "A1"
 * }
 */
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

/**
 * Zod schema for updating seating plan data (partial update)
 *
 * @description Schema that validates seating plan data when updating existing seating plan records (all fields are optional)
 *
 * @example
 * {
 *   seat_number: "A2",
 *   monitor_status: "Defective",
 *   keyboard_status: "Good condition"
 * }
 */
export const patchSeatingPlanSchema
  = createInsertSchema(seating_plan).partial()

/**
 * Seating history table schema definition
 *
 * @description Defines the structure for seating history records in the system
 *
 * @property {string} id - Unique identifier for the seating history record (auto-generated using nanoid)
 * @property {string} laboratory_id - Reference to the associated laboratory (foreign key to laboratory table)
 * @property {string} student_id - Reference to the associated student (foreign key to students table)
 * @property {string} seating_id - Reference to the associated seating plan (foreign key to seating_plan table)
 * @property {string} monitor - Status of the monitor
 * @property {string} mouse - Status of the mouse
 * @property {string} keyboard - Status of the keyboard
 * @property {string} cables - Status of the cables
 * @property {Date} created_at - Timestamp when the seating history was created (auto-generated)
 * @property {Date} updated_at - Timestamp when the seating history was last updated (auto-generated and auto-updated)
 */
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

/**
 * Zod schema for selecting seating history data
 *
 * @description Schema that represents the structure of seating history data when reading from the database
 *
 * @example
 * {
 *   id: "seatHist123",
 *   laboratory_id: "lab456",
 *   student_id: "student101",
 *   seating_id: "seat123",
 *   monitor: "Good condition",
 *   mouse: "Good condition",
 *   keyboard: "Defective",
 *   cables: "Good condition",
 *   created_at: "2023-01-01T00:00:00.000Z",
 *   updated_at: "2023-01-02T00:00:00.000Z"
 * }
 */
export const seatingHistorySelectSchema = createSelectSchema(seating_history)

/**
 * Zod schema for inserting new seating history data
 *
 * @description Schema that validates seating history data when creating new seating history records
 *
 * @property {string} laboratory_id - Reference to the associated laboratory (required)
 * @property {string} student_id - Reference to the associated student (required)
 * @property {string} seating_id - Reference to the associated seating plan (required)
 *
 * @example
 * {
 *   laboratory_id: "lab456",
 *   student_id: "student101",
 *   seating_id: "seat123"
 * }
 */
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

/**
 * Zod schema for updating seating history data (partial update)
 *
 * @description Schema that validates seating history data when updating existing seating history records (all fields are optional)
 *
 * @example
 * {
 *   monitor: "Defective",
 *   keyboard: "Good condition"
 * }
 */
export const patchSeatingHistorySchema
  = createInsertSchema(seating_history).partial()

/**
 * Lab activity log table schema definition
 *
 * @description Defines the structure for laboratory activity log records in the system
 *
 * @property {string} id - Unique identifier for the activity log entry (auto-generated using nanoid)
 * @property {string} laboratory_id - Reference to the associated laboratory (foreign key to laboratory table)
 * @property {string} schedule_id - Reference to the associated schedule (foreign key to schedule table, nullable)
 * @property {string} seating_id - Reference to the associated seating history (foreign key to seating_history table, nullable)
 * @property {string} status - Status of the activity log entry
 * @property {Date} time_in - Time when the user checked in to the lab
 * @property {Date} time_out - Time when the user checked out of the lab
 * @property {Date} created_at - Timestamp when the activity log was created (auto-generated)
 * @property {Date} updated_at - Timestamp when the activity log was last updated (auto-generated and auto-updated)
 */
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

/**
 * Zod schema for selecting lab activity log data
 *
 * @description Schema that represents the structure of lab activity log data when reading from the database
 *
 * @example
 * {
 *   id: "log123",
 *   laboratory_id: "lab456",
 *   schedule_id: "sched789",
 *   seating_id: "seatHist101",
 *   status: "active",
 *   time_in: "2023-01-01T08:00:00.000Z",
 *   time_out: "2023-01-01T10:00:00.000Z",
 *   created_at: "2023-01-01T00:00:00.000Z",
 *   updated_at: "2023-01-02T00:00:00.000Z"
 * }
 */
export const labActivityLogSelectSchema = createSelectSchema(lab_activity_log)

/**
 * Zod schema for inserting new lab activity log data
 *
 * @description Schema that validates lab activity log data when creating new activity log records
 *
 * @property {string} laboratory_id - Reference to the associated laboratory (required)
 * @property {string} schedule_id - Reference to the associated schedule (required)
 * @property {string} seating_id - Reference to the associated seating history (required)
 * @property {Date} time_in - Time when the user checked in to the lab (required)
 * @property {Date} time_out - Time when the user checked out of the lab (required)
 *
 * @example
 * {
 *   laboratory_id: "lab456",
 *   schedule_id: "sched789",
 *   seating_id: "seatHist101",
 *   time_in: "2023-01-01T08:00:00.000Z",
 *   time_out: "2023-01-01T10:00:00.000Z"
 * }
 */
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

/**
 * Zod schema for updating lab activity log data (partial update)
 *
 * @description Schema that validates lab activity log data when updating existing activity log records (all fields are optional)
 *
 * @example
 * {
 *   status: "completed",
 *   time_out: "2023-01-01T11:00:0.000Z"
 * }
 */
export const patchLabActivityLogSchema
  = createInsertSchema(lab_activity_log).partial()

/**
 * Refresh tokens table schema definition
 *
 * @description Defines the structure for refresh token records in the system
 *
 * @property {string} id - Unique identifier for the refresh token (auto-generated using nanoid)
 * @property {string} user_id - Reference to the associated user (foreign key to users table with cascade delete)
 * @property {string} selector - Unique selector for the refresh token (for O(1) lookups)
 * @property {string} token_hash - Hash of the refresh token verifier
 * @property {Date} expires_at - Expiration date of the refresh token
 * @property {Date} created_at - Timestamp when the refresh token was created (auto-generated)
 * @property {Date} updated_at - Timestamp when the refresh token was last updated (auto-generated and auto-updated)
 */
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

/**
 * Zod schema for selecting refresh token data
 *
 * @description Schema that represents the structure of refresh token data when reading from the database
 *
 * @example
 * {
 *   id: "refresh123",
 *   user_id: "user456",
 *   selector: "sel789",
 *   token_hash: "hashedTokenValue",
 *   expires_at: "2023-12-31T23:59:59.000Z",
 *   created_at: "2023-01-01T00:00:00.000Z",
 *   updated_at: "2023-01-02T00:00:00.000Z"
 * }
 */
export const refreshTokenSelectSchema = createSelectSchema(refreshTokens)

/**
 * Zod schema for inserting new refresh token data
 *
 * @description Schema that validates refresh token data when creating new refresh token records
 *
 * @example
 * {
 *   user_id: "user456",
 *   selector: "sel789",
 *   token_hash: "hashedTokenValue",
 *   expires_at: "2023-12-31T23:59:59.000Z"
 * }
 */
export const refreshTokenInsertSchema = createInsertSchema(refreshTokens)
  .omit({ id: true, createdAt: true, updatedAt: true })

// Define relations for users and refresh tokens
/**
 * Relations for users table
 *
 * @description Defines the relationship between users and refresh tokens
 *
 * @property {Array} refreshTokens - One-to-many relationship with refresh tokens
 */
export const usersRelations = relations(users, ({ many }) => ({
  refreshTokens: many(refreshTokens),
}))

/**
 * Relations for refresh tokens table
 *
 * @description Defines the relationship between refresh tokens and users
 *
 * @property {Object} user - Many-to-one relationship with users
 */
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

