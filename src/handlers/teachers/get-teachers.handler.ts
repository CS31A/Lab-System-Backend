/**
 * @fileoverview Teachers retrieval handler with pagination and database integration
 */

import type { AppRouteHandler } from '@/lib/types/app-types'
import type { GetTeachers } from '@/routes/teachers/teachers.routes'
import { count } from 'drizzle-orm'
import { createDb } from '@/db'
import { teachers } from '@/db/schema'
import * as httpStatusCodes from '@/openapi/http-status-codes'

/**
 * Retrieves paginated list of teachers from the database.
 * Supports pagination with configurable page size and includes metadata.
 */
export const GetTeachersHandler: AppRouteHandler<GetTeachers> = async (c) => {
  try {
    // Parse and validate query parameters
    const { page, limit } = c.req.valid('query')
    const offset = (page - 1) * limit

    const db = createDb(c)
    // const page = Math.max(1, Number.parseInt(query.page || 1, 10))
    // const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit || 10, 10)))
    // const offset = (page - 1) * limit

    const [totalResult, teachersData] = await Promise.all([
      db.select({ count: count() })
        .from(teachers),
      db
        .select()
        .from(teachers)
        .limit(limit)
        .offset(offset)
        .orderBy(teachers.created_at),
    ])

    // Validate pagination parameters
    // if (Number.isNaN(page) || Number.isNaN(limit)) {
    //   return c.json(
    //     {
    //       message: 'Invalid pagination parameters',
    //       errors: 'Page and limit must be valid numbers',
    //     },
    //     httpStatusCodes.BAD_REQUEST,
    //   )
    // }

    // Get total count for pagination metadata
    // const [totalResult] = await db
    //   .select({ count: count() })
    //   .from(teachers)

    const total = totalResult[0].count
    const totalPages = Math.ceil(total / limit)

    // Get paginated teachers data
    // const teachersData = await db
    //   .select()
    //   .from(teachers)
    //   .limit(limit)
    //   .offset(offset)
    //   .orderBy(teachers.created_at)

    // Calculate pagination metadata
    const pagination = {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    }

    return c.json(
      {
        message: 'List of teachers retrieved successfully',
        data: teachersData,
        pagination,
      },
      httpStatusCodes.OK,
    )
  }
  catch (err) {
    // Log error with context for debugging
    c.var.logger.error('Failed to retrieve teachers', {
      error: (err as Error).message,
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
