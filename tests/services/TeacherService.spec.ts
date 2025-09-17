import type { Context } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TeacherService } from '@/services/TeacherService'

const mockCreatedAt = new Date('2024-01-01T00:00:00Z')
const mockUpdatedAt = new Date('2024-01-01T00:00:00Z')

// Mock the database module
vi.mock('@/db', () => ({
  createDb: vi.fn(() => createMockDb()),
}))

// Mock database results
const mockLaboratoriesWithSchedules = [
  {
    // Laboratory data
    id: 'lab001',
    name: 'Computer Lab 1',
    status: true,
    created_at: mockCreatedAt,
    updated_at: mockUpdatedAt,
    // Schedule data (occupied lab)
    scheduleId: 'sched001',
    section: 'CS-3A',
    startTime: new Date('2024-01-15T08:00:00Z'),
    endTime: new Date('2024-01-15T10:00:00Z'),
    scheduleStatus: 'active',
    subjectName: 'Data Structures',
    teacherFirstname: 'John',
    teacherLastname: 'Doe',
  },
  {
    // Laboratory data
    id: 'lab002',
    name: 'Computer Lab 2',
    status: true,
    created_at: mockCreatedAt,
    updated_at: mockUpdatedAt,
    // No schedule data (available lab)
    scheduleId: null,
    section: null,
    startTime: null,
    endTime: null,
    scheduleStatus: null,
    subjectName: null,
    teacherFirstname: null,
    teacherLastname: null,
  },
  {
    // Laboratory data
    id: 'lab003',
    name: 'Computer Lab 3',
    status: false, // Under maintenance
    created_at: mockCreatedAt,
    updated_at: mockUpdatedAt,
    // No schedule data
    scheduleId: null,
    section: null,
    startTime: null,
    endTime: null,
    scheduleStatus: null,
    subjectName: null,
    teacherFirstname: null,
    teacherLastname: null,
  },
]

function createMockDb() {
  let selectResults: any[] = []

  const mockDb = {
    // Set what select queries should return
    setSelectResults: (results: any[]) => {
      selectResults = results
    },

    // Mock select chain: db.select().from(table).leftJoin().leftJoin().leftJoin().orderBy()
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        leftJoin: vi.fn(() => ({
          leftJoin: vi.fn(() => ({
            leftJoin: vi.fn(() => ({
              where: vi.fn(() => ({
                orderBy: vi.fn(async () => selectResults),
              })),
              orderBy: vi.fn(async () => selectResults),
            })),
          })),
        })),
      })),
    })),

    // Mock count chain: db.select().from(table).where()
    count: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(async () => [{ count: selectResults.length }]),
      })),
    })),
  }

  return mockDb
}

// Mock logger
const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}

function createFakeContext(): Context {
  return {
    env: { DATABASE_URL: 'postgres://test-url' },
    var: {
      logger: mockLogger,
    },
  } as unknown as Context
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('teacherService.getLaboratoriesWithCurrentStatus', () => {
  it('should successfully retrieve laboratories with current status', async () => {
    const mockContext = createFakeContext()
    const mockDb = createMockDb()
    mockDb.setSelectResults(mockLaboratoriesWithSchedules)
    const teacherService = new TeacherService(mockContext)
    // Mock the database instance
    ;(teacherService as any).db = mockDb

    const result = await teacherService.getLaboratoriesWithCurrentStatus()

    expect(result).toHaveLength(3)

    // Verify occupied laboratory
    expect(result[0]).toEqual({
      id: 'lab001',
      name: 'Computer Lab 1',
      status: true,
      vacancy_status: 'occupied',
      current_schedule: {
        id: 'sched001',
        section: 'CS-3A',
        start_time: '2024-01-15T08:00:00.000Z',
        end_time: '2024-01-15T10:00:00.000Z',
        subject_name: 'Data Structures',
        teacher_name: 'John Doe',
      },
      created_at: mockCreatedAt.toISOString(),
      updated_at: mockUpdatedAt.toISOString(),
    })

    // Verify available laboratory
    expect(result[1]).toEqual({
      id: 'lab002',
      name: 'Computer Lab 2',
      status: true,
      vacancy_status: 'available',
      current_schedule: null,
      created_at: mockCreatedAt.toISOString(),
      updated_at: mockUpdatedAt.toISOString(),
    })

    // Verify maintenance laboratory
    expect(result[2]).toEqual({
      id: 'lab003',
      name: 'Computer Lab 3',
      status: false,
      vacancy_status: 'maintenance',
      current_schedule: null,
      created_at: mockCreatedAt.toISOString(),
      updated_at: mockUpdatedAt.toISOString(),
    })

    // Verify logger was called
    expect(mockLogger.info).toHaveBeenCalledWith(
      'Laboratories with current status retrieved successfully',
      {
        totalLaboratories: 3,
        available: 1,
        occupied: 1,
        maintenance: 1,
        timestamp: expect.any(String),
      },
    )
  })

  it('should return empty array when no laboratories exist', async () => {
    const mockContext = createFakeContext()
    const mockDb = createMockDb()
    mockDb.setSelectResults([])
    const teacherService = new TeacherService(mockContext)
    ;(teacherService as any).db = mockDb

    const result = await teacherService.getLaboratoriesWithCurrentStatus()

    expect(result).toEqual([])
    expect(mockLogger.info).toHaveBeenCalledWith(
      'Laboratories with current status retrieved successfully',
      {
        totalLaboratories: 0,
        available: 0,
        occupied: 0,
        maintenance: 0,
        timestamp: expect.any(String),
      },
    )
  })

  it('should handle teacher name formatting correctly', async () => {
    const mockContext = createFakeContext()
    const mockDb = createMockDb()

    const mockDataWithVariousNames = [
      {
        ...mockLaboratoriesWithSchedules[0],
        teacherFirstname: 'John',
        teacherLastname: 'Doe',
      },
      {
        ...mockLaboratoriesWithSchedules[0],
        id: 'lab004',
        name: 'Lab 4',
        teacherFirstname: 'Jane',
        teacherLastname: null,
      },
      {
        ...mockLaboratoriesWithSchedules[0],
        id: 'lab005',
        name: 'Lab 5',
        teacherFirstname: null,
        teacherLastname: 'Smith',
      },
      {
        ...mockLaboratoriesWithSchedules[0],
        id: 'lab006',
        name: 'Lab 6',
        teacherFirstname: null,
        teacherLastname: null,
      },
    ]

    mockDb.setSelectResults(mockDataWithVariousNames)
    const teacherService = new TeacherService(mockContext)
    ;(teacherService as any).db = mockDb

    const result = await teacherService.getLaboratoriesWithCurrentStatus()

    expect(result[0].current_schedule?.teacher_name).toBe('John Doe')
    expect(result[1].current_schedule?.teacher_name).toBe('Jane')
    expect(result[2].current_schedule?.teacher_name).toBe('Smith')
    expect(result[3].current_schedule?.teacher_name).toBe('Unknown')
  })

  it('should handle database errors', async () => {
    const mockContext = createFakeContext()
    // Mock database error by making the orderBy method reject
    const mockDb = {
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          leftJoin: vi.fn(() => ({
            leftJoin: vi.fn(() => ({
              leftJoin: vi.fn(() => ({
                where: vi.fn(() => ({
                  orderBy: vi.fn().mockRejectedValue(new Error('Database connection failed')),
                })),
                orderBy: vi.fn().mockRejectedValue(new Error('Database connection failed')),
              })),
            })),
          })),
        })),
      })),
    }
    const teacherService = new TeacherService(mockContext)
    ;(teacherService as any).db = mockDb

    await expect(teacherService.getLaboratoriesWithCurrentStatus()).rejects.toThrow(
      'Database connection failed',
    )

    expect(mockLogger.error).toHaveBeenCalledWith(
      'Failed to retrieve laboratories with current status',
      {
        error: 'Database connection failed',
        timestamp: expect.any(String),
      },
    )
  })

  it('should correctly determine vacancy status based on conditions', async () => {
    const mockContext = createFakeContext()
    const mockDb = createMockDb()

    const testCases = [
      {
        ...mockLaboratoriesWithSchedules[0],
        id: 'lab_available',
        name: 'Available Lab',
        status: true,
        scheduleId: null,
        expectedStatus: 'available',
      },
      {
        ...mockLaboratoriesWithSchedules[0],
        id: 'lab_occupied',
        name: 'Occupied Lab',
        status: true,
        scheduleId: 'sched001',
        expectedStatus: 'occupied',
      },
      {
        ...mockLaboratoriesWithSchedules[0],
        id: 'lab_maintenance',
        name: 'Maintenance Lab',
        status: false,
        scheduleId: null,
        expectedStatus: 'maintenance',
      },
    ]

    mockDb.setSelectResults(testCases)
    const teacherService = new TeacherService(mockContext)
    ;(teacherService as any).db = mockDb

    const result = await teacherService.getLaboratoriesWithCurrentStatus()

    expect(result[0].vacancy_status).toBe('available')
    expect(result[1].vacancy_status).toBe('occupied')
    expect(result[2].vacancy_status).toBe('maintenance')
  })
})
