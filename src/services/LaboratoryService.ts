/**
 * @fileoverview LaboratoryService - Core business logic for laboratory management
 * Handles laboratory data retrieval, creation, updates, and deletion
 */

import type { Context } from 'hono'
import type { z } from 'zod'
import type { laboratoryInsertSchema, patchLaboratorySchema } from '@/db/schema'
import { count, eq } from 'drizzle-orm'
import { createDb, createServerlessDb } from '@/db'
import { laboratory } from '@/db/schema'

export type CreateLaboratoryData = z.infer<typeof laboratoryInsertSchema>
export type UpdateLaboratoryData = z.infer<typeof patchLaboratorySchema>

export interface ListLaboratoriesParams {
  page: number
  limit: number
}

export interface ListLaboratoriesResult {
  laboratories: Array<typeof laboratory.$inferSelect>
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export class LaboratoryService {
  private db: ReturnType<typeof createDb>
  private serverlessDb: ReturnType<typeof createServerlessDb>
  private logger: any

  constructor(c: Context) {
    this.db = createDb(c)
    this.serverlessDb = createServerlessDb(c)
    this.logger = c.var.logger
  }

  /**
   * Creates a new laboratory
   * @param {CreateLaboratoryData} laboratoryData - The data for creating the laboratory
   * @returns {Promise<typeof laboratory.$inferSelect>} The created laboratory record
   * @throws {Error} If the laboratory creation fails
   */
  async createLaboratory(laboratoryData: CreateLaboratoryData) {
    try {
      const [createdLaboratory] = await this.db
        .insert(laboratory)
        .values(laboratoryData)
        .returning()

      this.logger.info('Laboratory created successfully', {
        laboratoryId: createdLaboratory.id,
        laboratoryName: createdLaboratory.name,
        timestamp: new Date().toISOString(),
      })

      return createdLaboratory
    }
    catch (error) {
      this.logger.error('Failed to create laboratory', {
        error: (error as Error).message,
        laboratoryData,
        timestamp: new Date().toISOString(),
      })
      throw error
    }
  }

  /**
   * Retrieves a laboratory by ID
   * @param {string} id - The unique identifier of the laboratory
   * @returns {Promise<(typeof laboratory.$inferSelect) | null>} The laboratory record if found, null otherwise
   * @throws {Error} If the retrieval fails
   */
  async getLaboratoryById(id: string) {
    try {
      const [laboratoryRecord] = await this.db
        .select()
        .from(laboratory)
        .where(eq(laboratory.id, id))
        .limit(1)

      return laboratoryRecord || null
    }
    catch (error) {
      this.logger.error('Failed to retrieve laboratory', {
        error: (error as Error).message,
        laboratoryId: id,
        timestamp: new Date().toISOString(),
      })
      throw error
    }
  }

  /**
   * Updates a laboratory by ID
   * @param {string} id - The unique identifier of the laboratory to update
   * @param {UpdateLaboratoryData} updateData - The data to update the laboratory with
   * @returns {Promise<typeof laboratory.$inferSelect>} The updated laboratory record
   * @throws {Error} If the update fails or if the laboratory is not found
   */
  async updateLaboratory(id: string, updateData: UpdateLaboratoryData) {
    try {
      // Update the laboratory directly
      const [updatedLaboratory] = await this.db
        .update(laboratory)
        .set(updateData)
        .where(eq(laboratory.id, id))
        .returning()

      // Check if any rows were updated
      if (!updatedLaboratory) {
        throw new Error('Laboratory not found')
      }

      this.logger.info('Laboratory updated successfully', {
        laboratoryId: id,
        updatedFields: Object.keys(updateData),
        timestamp: new Date().toISOString(),
      })

      return updatedLaboratory
    }
    catch (error) {
      // Handle unique constraint violation (PostgreSQL error code 23505)
      if ((error as any).code === '23505' && (error as any).message.includes('laboratory_name_unique')) {
        this.logger.warn('Attempt to update laboratory with duplicate name', {
          laboratoryId: id,
          updateData,
          timestamp: new Date().toISOString(),
        })
        throw new Error('A laboratory with this name already exists')
      }

      this.logger.error('Failed to update laboratory', {
        error: (error as Error).message,
        laboratoryId: id,
        updateData,
        timestamp: new Date().toISOString(),
      })
      throw error
    }
  }

  /**
   * Deletes a laboratory by ID
   * @param {string} id - The unique identifier of the laboratory to delete
   * @returns {Promise<typeof laboratory.$inferSelect>} The deleted laboratory record
   * @throws {Error} If the deletion fails or if the laboratory is not found
   */
  async deleteLaboratory(id: string) {
    try {
      // Delete the laboratory directly
      const [deletedLaboratory] = await this.db
        .delete(laboratory)
        .where(eq(laboratory.id, id))
        .returning()

      // Check if any rows were deleted
      if (!deletedLaboratory) {
        throw new Error('Laboratory not found')
      }

      this.logger.info('Laboratory deleted successfully', {
        laboratoryId: id,
        laboratoryName: deletedLaboratory.name,
        timestamp: new Date().toISOString(),
      })

      return deletedLaboratory
    }
    catch (error) {
      this.logger.error('Failed to delete laboratory', {
        error: (error as Error).message,
        laboratoryId: id,
        timestamp: new Date().toISOString(),
      })
      throw error
    }
  }

  /**
   * Lists laboratories with pagination
   * @param {ListLaboratoriesParams} params - The pagination parameters
   * @returns {Promise<ListLaboratoriesResult>} The list of laboratories with pagination metadata
   * @throws {Error} If the retrieval fails
   */
  async listLaboratories(params: ListLaboratoriesParams): Promise<ListLaboratoriesResult> {
    const { page, limit } = params
    const offset = (page - 1) * limit

    try {
      // Use transaction to ensure consistency between count and select queries
      const result = await this.serverlessDb.transaction(async (tx) => {
        const [totalResult, laboratoriesData] = await Promise.all([
          tx.select({ count: count() })
            .from(laboratory),
          tx
            .select()
            .from(laboratory)
            .limit(limit)
            .offset(offset)
            .orderBy(laboratory.created_at),
        ])

        const total = totalResult[0]?.count || 0
        const totalPages = Math.ceil(total / limit) || 1

        // Calculate pagination metadata
        const pagination = {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        }

        return {
          laboratories: laboratoriesData,
          pagination,
        }
      })

      this.logger.info('Laboratories list retrieved successfully', {
        page,
        limit,
        total: result.pagination.total,
        totalPages: result.pagination.totalPages,
        returned_count: result.laboratories.length,
        timestamp: new Date().toISOString(),
      })

      return result
    }
    catch (error) {
      this.logger.error('Failed to retrieve laboratories list', {
        error: (error as Error).message,
        page,
        limit,
        timestamp: new Date().toISOString(),
      })
      throw error
    }
  }

  /**
   * Retrieves all laboratories without pagination
   * @returns {Promise<Array<typeof laboratory.$inferSelect>>} All laboratory records
   * @throws {Error} If the retrieval fails
   */
  async getAllLaboratories() {
    try {
      const allLaboratories = await this.db
        .select()
        .from(laboratory)
        .orderBy(laboratory.created_at)

      this.logger.info('All laboratories retrieved successfully', {
        count: allLaboratories.length,
        timestamp: new Date().toISOString(),
      })

      return allLaboratories
    }
    catch (error) {
      this.logger.error('Failed to retrieve all laboratories', {
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      })
      throw error
    }
  }
}
