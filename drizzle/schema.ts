import { boolean, foreignKey, pgTable, timestamp, unique, varchar } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: varchar({ length: 12 }).primaryKey().notNull(),
  email: varchar({ length: 255 }).notNull(),
  password: varchar({ length: 255 }).notNull(),
  userType: varchar('user_type', { length: 20 }).notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  username: varchar({ length: 255 }).notNull(),
}, table => [
  unique('users_email_unique').on(table.email),
  unique('users_username_unique').on(table.username),
])

export const teachers = pgTable('teachers', {
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  id: varchar({ length: 12 }).primaryKey().notNull(),
  userId: varchar('user_id', { length: 12 }).notNull(),
  firstname: varchar({ length: 100 }),
  lastname: varchar({ length: 100 }),
  attendance: varchar({ length: 20 }).default('present').notNull(),
}, table => [
  foreignKey({
    columns: [table.userId],
    foreignColumns: [users.id],
    name: 'teachers_user_id_users_id_fk',
  }),
])

export const admins = pgTable('admins', {
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  id: varchar({ length: 12 }).primaryKey().notNull(),
  userId: varchar('user_id', { length: 12 }).notNull(),
  firstname: varchar({ length: 100 }),
  lastname: varchar({ length: 100 }),
}, table => [
  foreignKey({
    columns: [table.userId],
    foreignColumns: [users.id],
    name: 'admins_user_id_users_id_fk',
  }),
])

export const technicalStaff = pgTable('technical_staff', {
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  id: varchar({ length: 12 }).primaryKey().notNull(),
  userId: varchar('user_id', { length: 12 }).notNull(),
  firstname: varchar({ length: 100 }),
  lastname: varchar({ length: 100 }),
}, table => [
  foreignKey({
    columns: [table.userId],
    foreignColumns: [users.id],
    name: 'technical_staff_user_id_users_id_fk',
  }),
])

export const laboratory = pgTable('laboratory', {
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  id: varchar({ length: 12 }).primaryKey().notNull(),
  name: varchar({ length: 128 }).notNull(),
  status: boolean().default(true),
  timeIn: timestamp('time_in', { mode: 'string' }),
  timeOut: timestamp('time_out', { mode: 'string' }),
})

export const labActivityLog = pgTable('lab_activity_log', {
  id: varchar({ length: 12 }).primaryKey().notNull(),
  laboratoryId: varchar('laboratory_id', { length: 12 }).notNull(),
  scheduleId: varchar('schedule_id', { length: 12 }),
  seatingId: varchar('seating_id', { length: 12 }),
  status: varchar({ length: 50 }).notNull(),
  timeIn: timestamp('time_in', { mode: 'string' }),
  timeOut: timestamp('time_out', { mode: 'string' }),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
}, table => [
  foreignKey({
    columns: [table.laboratoryId],
    foreignColumns: [laboratory.id],
    name: 'lab_activity_log_laboratory_id_laboratory_id_fk',
  }),
  foreignKey({
    columns: [table.scheduleId],
    foreignColumns: [schedule.id],
    name: 'lab_activity_log_schedule_id_schedule_id_fk',
  }),
  foreignKey({
    columns: [table.seatingId],
    foreignColumns: [seatingHistory.id],
    name: 'lab_activity_log_seating_id_seating_history_id_fk',
  }),
])

export const schedule = pgTable('schedule', {
  id: varchar({ length: 12 }).primaryKey().notNull(),
  laboratoryId: varchar('laboratory_id', { length: 12 }).notNull(),
  teacherId: varchar('teacher_id', { length: 12 }).notNull(),
  subjectId: varchar('subject_id', { length: 12 }).notNull(),
  section: varchar({ length: 30 }).notNull(),
  startTime: timestamp('start_time', { mode: 'string' }).notNull(),
  endTime: timestamp('end_time', { mode: 'string' }).notNull(),
  status: varchar({ length: 20 }).default('scheduled'),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
}, table => [
  foreignKey({
    columns: [table.laboratoryId],
    foreignColumns: [laboratory.id],
    name: 'schedule_laboratory_id_laboratory_id_fk',
  }),
  foreignKey({
    columns: [table.teacherId],
    foreignColumns: [teachers.id],
    name: 'schedule_teacher_id_teachers_id_fk',
  }),
  foreignKey({
    columns: [table.subjectId],
    foreignColumns: [subjects.id],
    name: 'schedule_subject_id_subjects_id_fk',
  }),
])

export const seatingHistory = pgTable('seating_history', {
  id: varchar({ length: 12 }).primaryKey().notNull(),
  laboratoryId: varchar('laboratory_id', { length: 12 }).notNull(),
  studentId: varchar('student_id', { length: 12 }).notNull(),
  seatingId: varchar('seating_id', { length: 12 }).notNull(),
  monitor: varchar({ length: 255 }).notNull(),
  mouse: varchar({ length: 255 }).notNull(),
  keyboard: varchar({ length: 255 }).notNull(),
  cables: varchar({ length: 255 }).notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
}, table => [
  foreignKey({
    columns: [table.laboratoryId],
    foreignColumns: [laboratory.id],
    name: 'seating_history_laboratory_id_laboratory_id_fk',
  }),
  foreignKey({
    columns: [table.studentId],
    foreignColumns: [students.id],
    name: 'seating_history_student_id_students_id_fk',
  }),
  foreignKey({
    columns: [table.seatingId],
    foreignColumns: [seatingPlan.id],
    name: 'seating_history_seating_id_seating_plan_id_fk',
  }),
])

export const subjects = pgTable('subjects', {
  id: varchar({ length: 12 }).primaryKey().notNull(),
  subjectName: varchar('subject_name', { length: 255 }).notNull(),
  subjectCode: varchar('subject_code', { length: 50 }).notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
})

export const students = pgTable('students', {
  id: varchar({ length: 12 }).primaryKey().notNull(),
  firstname: varchar({ length: 100 }).notNull(),
  lastname: varchar({ length: 100 }).notNull(),
  studentId: varchar('student_id', { length: 50 }).notNull(),
  section: varchar({ length: 30 }).notNull(),
  course: varchar({ length: 50 }).notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
}, table => [
  unique('students_student_id_unique').on(table.studentId),
])

export const seatingPlan = pgTable('seating_plan', {
  id: varchar({ length: 12 }).primaryKey().notNull(),
  laboratoryId: varchar('laboratory_id', { length: 12 }).notNull(),
  scheduleId: varchar('schedule_id', { length: 12 }).notNull(),
  studentId: varchar('student_id', { length: 12 }).notNull(),
  seatNumber: varchar('seat_number', { length: 10 }).notNull(),
  monitorStatus: varchar('monitor_status', { length: 255 }).notNull(),
  mouseStatus: varchar('mouse_status', { length: 255 }).notNull(),
  keyboardStatus: varchar('keyboard_status', { length: 255 }).notNull(),
  cablesStatus: varchar('cables_status', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
}, table => [
  foreignKey({
    columns: [table.laboratoryId],
    foreignColumns: [laboratory.id],
    name: 'seating_plan_laboratory_id_laboratory_id_fk',
  }),
  foreignKey({
    columns: [table.scheduleId],
    foreignColumns: [schedule.id],
    name: 'seating_plan_schedule_id_schedule_id_fk',
  }),
  foreignKey({
    columns: [table.studentId],
    foreignColumns: [students.id],
    name: 'seating_plan_student_id_students_id_fk',
  }),
])
