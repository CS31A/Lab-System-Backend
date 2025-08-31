import { describe, expect, it } from 'vitest'
import app from '@/index'

export const MOCK_ENV = {
  LOG_LEVEL: 'silent',
  DB_URL: 'postgresql://neondb_owner:npg_nwdvIUp6hg4b@ep-flat-sun-a1s7no3s-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  NODE_ENV: 'development',
  JWT_SECRET: 'supersecretidoldexiarongtestingdomini',
}

describe('health Check', () => {
  it('gET /health', async () => {
    const res = await app.request('/health', {}, MOCK_ENV)
    expect(res.status).toBe(200)

    const data: { message: string, status: string, timestamp: any } = await res.json()

    expect(data.message).toBe('Server is running')
    expect(data.status).toBe('healthy')
    expect(data).toHaveProperty('timestamp')
  })
})

describe('root path', () => {
  it('get /', async () => {
    const res = await app.request('/', {}, MOCK_ENV)
    expect(res.status).toBe(200)
    const data: { message: string } = await res.json()
    expect(data.message).toBe('Hono API')
  })
})
