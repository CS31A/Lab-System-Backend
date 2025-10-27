import type { Context } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CreateStudentHandler } from '@/handlers/students/students.handler'

interface CreateStudentSchemaData {
  firstname: string
  lastname: string
 student_id: string
  section: string
 course: string
}

// Mock the StudentService
const mockCreateStudent = vi.fn()
vi.mock('@/services/StudentService', () => ({
  StudentService: vi.fn().mockImplementation(() => ({
    createStudent: mockCreateStudent,
  })),
}))

function createMockContext(validatedData: CreateStudentSchemaData): Context {
  return {
    req: {
      valid: vi.fn().mockReturnValue(validatedData),
    },
    var: {
      logger: {
        info: vi.fn(),
        error: vi.fn(),
      },
    },
    json: vi.fn().mockImplementation((data, status) => ({ data, status })),
  } as unknown as Context
}

describe('CreateStudentHandler Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
 })

  it('successfully creates student with complete schema data', async () => {
    const schemaData: CreateStudentSchemaData = {
      firstname: 'John',
      lastname: 'Doe',
      student_id: 'S12345678',
      section: 'CS101-A',
      course: 'Computer Science'
    }

    const mockStudent = {
      id: 'student123',
      ...schemaData,
      created_at: new Date(),
      updated_at: new Date(),
    }

    mockCreateStudent.mockResolvedValue(mockStudent)

    const ctx = createMockContext(schemaData)
    // Cast to a simpler function type to avoid TypeScript errors
    const handler = CreateStudentHandler as unknown as (c: Context) => Promise<Response>
    const _result = await handler(ctx)

    // Verify StudentService.createStudent was called with the data
    expect(mockCreateStudent).toHaveBeenCalledWith(schemaData)

    // Verify response structure
    expect(ctx.json).toHaveBeenCalledWith(
      {
        message: 'Student created successfully',
        data: mockStudent,
      },
      201,
    )
  })

  it('handles service errors correctly', async () => {
    const schemaData: CreateStudentSchemaData = {
      firstname: 'Jane',
      lastname: 'Smith',
      student_id: 'S87654321',
      section: 'CS101-B',
      course: 'Computer Science'
    }

    mockCreateStudent.mockRejectedValue(new Error('Database connection failed'))

    const ctx = createMockContext(schemaData)
    // Cast to a simpler function type to avoid TypeScript errors
    const handler = CreateStudentHandler as unknown as (c: Context) => Promise<Response>
    const _result = await handler(ctx)

    // Verify error logging
    expect(ctx.var.logger.error).toHaveBeenCalledWith('Failed to create student', {
      error: 'Database connection failed',
      studentData: schemaData,
      timestamp: expect.any(String),
    })

    // Verify error response
    expect(ctx.json).toHaveBeenCalledWith(
      {
        message: 'Internal Server Error',
        errors: 'Database connection failed',
      },
      500,
    )
  })
})