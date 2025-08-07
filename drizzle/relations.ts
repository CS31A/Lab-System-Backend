import { relations } from 'drizzle-orm/relations'
import { admins, labActivityLog, laboratory, schedule, seatingHistory, seatingPlan, students, subjects, teachers, technicalStaff, users } from './schema'

export const adminsRelations = relations(admins, ({ one }) => ({
  user: one(users, {
    fields: [admins.userId],
    references: [users.id],
  }),
}))

export const usersRelations = relations(users, ({ many }) => ({
  admins: many(admins),
  teachers: many(teachers),
  technicalStaffs: many(technicalStaff),
}))

export const labActivityLogRelations = relations(labActivityLog, ({ one }) => ({
  laboratory: one(laboratory, {
    fields: [labActivityLog.laboratoryId],
    references: [laboratory.id],
  }),
  schedule: one(schedule, {
    fields: [labActivityLog.scheduleId],
    references: [schedule.id],
  }),
  seatingHistory: one(seatingHistory, {
    fields: [labActivityLog.seatingId],
    references: [seatingHistory.id],
  }),
}))

export const laboratoryRelations = relations(laboratory, ({ many }) => ({
  labActivityLogs: many(labActivityLog),
  schedules: many(schedule),
  seatingHistories: many(seatingHistory),
  seatingPlans: many(seatingPlan),
}))

export const scheduleRelations = relations(schedule, ({ one, many }) => ({
  labActivityLogs: many(labActivityLog),
  laboratory: one(laboratory, {
    fields: [schedule.laboratoryId],
    references: [laboratory.id],
  }),
  teacher: one(teachers, {
    fields: [schedule.teacherId],
    references: [teachers.id],
  }),
  subject: one(subjects, {
    fields: [schedule.subjectId],
    references: [subjects.id],
  }),
  seatingPlans: many(seatingPlan),
}))

export const seatingHistoryRelations = relations(seatingHistory, ({ one, many }) => ({
  labActivityLogs: many(labActivityLog),
  laboratory: one(laboratory, {
    fields: [seatingHistory.laboratoryId],
    references: [laboratory.id],
  }),
  student: one(students, {
    fields: [seatingHistory.studentId],
    references: [students.id],
  }),
  seatingPlan: one(seatingPlan, {
    fields: [seatingHistory.seatingId],
    references: [seatingPlan.id],
  }),
}))

export const teachersRelations = relations(teachers, ({ one, many }) => ({
  schedules: many(schedule),
  user: one(users, {
    fields: [teachers.userId],
    references: [users.id],
  }),
}))

export const subjectsRelations = relations(subjects, ({ many }) => ({
  schedules: many(schedule),
}))

export const studentsRelations = relations(students, ({ many }) => ({
  seatingHistories: many(seatingHistory),
  seatingPlans: many(seatingPlan),
}))

export const seatingPlanRelations = relations(seatingPlan, ({ one, many }) => ({
  seatingHistories: many(seatingHistory),
  laboratory: one(laboratory, {
    fields: [seatingPlan.laboratoryId],
    references: [laboratory.id],
  }),
  schedule: one(schedule, {
    fields: [seatingPlan.scheduleId],
    references: [schedule.id],
  }),
  student: one(students, {
    fields: [seatingPlan.studentId],
    references: [students.id],
  }),
}))

export const technicalStaffRelations = relations(technicalStaff, ({ one }) => ({
  user: one(users, {
    fields: [technicalStaff.userId],
    references: [users.id],
  }),
}))
