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

    const total = totalResult[0].count
    const totalPages = Math.ceil(total / limit)

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
