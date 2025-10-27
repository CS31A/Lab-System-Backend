/**
 * @fileoverview Schedule handlers - delegates to ScheduleService for business logic
 */

import type { AppRouteHandler } from '@/lib/types/app-types'
import type {
  createScheduleRoute,
  deleteScheduleRoute,
  getScheduleRoute,
  listSchedulesRoute,
  updateScheduleRoute,
} from '@/routes/schedule/schedule.route'
import * as httpStatusCodes from '@/openapi/http-status-codes'
import { ScheduleService } from '@/services/ScheduleService'

/**
 * Creates a new schedule
 */
export const CreateScheduleHandler: AppRouteHandler<typeof createScheduleRoute> = async (c) => {
  const validatedBody = c.req.valid('json')

  try {
    const scheduleService = new ScheduleService(c)
    const createdSchedule = await scheduleService.createSchedule({
      laboratory_id: validatedBody.laboratory_id,
      teacher_id: validatedBody.teacher_id,
      subject_id: validatedBody.subject_id,
      section: validatedBody.section,
      start_time: validatedBody.start_time,
      end_time: validatedBody.end_time,
      status: validatedBody.status,
    })

    return c.json(
      {
        message: 'Schedule created successfully',
        data: createdSchedule,
      },
      httpStatusCodes.CREATED,
    )
  }
  catch (err) {
    c.var.logger.error('Schedule creation failed', {
      error: (err as Error).message,
      scheduleData: validatedBody,
      timestamp: new Date().toISOString(),
    })

    return c.json(
      {
        message: 'Internal Server Error',
        errors: (err as Error).message,
      },
      httpStatusCodes.INTERNAL_SERVER_ERROR,
    )
  }
}

/**
 * Retrieves a schedule by ID
 */
export const GetScheduleHandler: AppRouteHandler<typeof getScheduleRoute> = async (c) => {
  const { id } = c.req.valid('param')

  try {
    const scheduleService = new ScheduleService(c)
    const scheduleRecord = await scheduleService.getScheduleById(id)

    if (!scheduleRecord) {
      return c.json(
        {
          message: 'Schedule not found',
        },
        httpStatusCodes.NOT_FOUND,
      )
    }

    return c.json(
      {
        message: 'Schedule retrieved successfully',
        data: scheduleRecord,
      },
      httpStatusCodes.OK,
    )
  }
  catch (err) {
    c.var.logger.error('Failed to retrieve schedule', {
      error: (err as Error).message,
      scheduleId: id,
      timestamp: new Date().toISOString(),
    })

    return c.json(
      {
        message: 'Internal Server Error',
        errors: (err as Error).message,
      },
      httpStatusCodes.INTERNAL_SERVER_ERROR,
    )
  }
}

/**
 * Updates a schedule by ID
 */
export const UpdateScheduleHandler: AppRouteHandler<typeof updateScheduleRoute> = async (c) => {
  const { id } = c.req.valid('param')
  const body = c.req.valid('json')

  try {
    const scheduleService = new ScheduleService(c)
    const updatedSchedule = await scheduleService.updateSchedule(id, {
      laboratory_id: body.laboratory_id,
      teacher_id: body.teacher_id,
      subject_id: body.subject_id,
      section: body.section,
      start_time: body.start_time,
      end_time: body.end_time,
      status: body.status,
    })

    return c.json(
      {
        message: 'Schedule updated successfully',
        data: updatedSchedule,
      },
      httpStatusCodes.OK,
    )
  }
  catch (err) {
    if (err instanceof Error && err.message === 'Schedule not found') {
      return c.json(
        {
          message: 'Schedule not found',
        },
        httpStatusCodes.NOT_FOUND,
      )
    }

    c.var.logger.error('Schedule update failed', {
      error: (err as Error).message,
      scheduleId: id,
      timestamp: new Date().toISOString(),
    })

    return c.json(
      {
        message: 'Internal Server Error',
        errors: (err as Error).message,
      },
      httpStatusCodes.INTERNAL_SERVER_ERROR,
    )
  }
}

/**
 * Deletes a schedule by ID
 */
export const DeleteScheduleHandler: AppRouteHandler<typeof deleteScheduleRoute> = async (c) => {
  const { id } = c.req.valid('param')

  try {
    const scheduleService = new ScheduleService(c)
    await scheduleService.deleteSchedule(id)

    return c.json(
      {
        message: 'Schedule deleted successfully',
      },
      httpStatusCodes.OK,
    )
  }
  catch (err) {
    if (err instanceof Error && err.message === 'Schedule not found') {
      return c.json(
        {
          message: 'Schedule not found',
        },
        httpStatusCodes.NOT_FOUND,
      )
    }

    c.var.logger.error('Schedule deletion failed', {
      error: (err as Error).message,
      scheduleId: id,
      timestamp: new Date().toISOString(),
    })

    return c.json(
      {
        message: 'Internal Server Error',
        errors: (err as Error).message,
      },
      httpStatusCodes.INTERNAL_SERVER_ERROR,
    )
  }
}

/**
 * Lists schedules with pagination
 */
export const ListSchedulesHandler: AppRouteHandler<typeof listSchedulesRoute> = async (c) => {
  const { page = 1, limit = 10 } = c.req.valid('query')

  try {
    const scheduleService = new ScheduleService(c)
    const result = await scheduleService.listSchedules({ page, limit })

    return c.json(
      {
        message: 'Schedules retrieved successfully',
        data: result.schedules,
        pagination: result.pagination,
      },
      httpStatusCodes.OK,
    )
  }
  catch (err) {
    c.var.logger.error('Failed to retrieve schedules list', {
      error: (err as Error).message,
      page,
      limit,
      timestamp: new Date().toISOString(),
    })

    return c.json(
      {
        message: 'Internal Server Error',
        errors: (err as Error).message,
      },
      httpStatusCodes.INTERNAL_SERVER_ERROR,
    )
  }
}
