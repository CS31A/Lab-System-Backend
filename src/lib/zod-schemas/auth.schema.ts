import { z } from '@hono/zod-openapi'

export const loginBodySchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
})

export const meDataSchema = z.object({
  sub: z.string(),
  role: z.string(),
})

export const loginResponseSchema = z.object({
  message: z.string(),
  data: z.object({
    id: z.string(),
    username: z.string(),
    role: z.string(),
  }),
})

export const errorResponseSchema = z.object({
  message: z.string(),
  errors: z.any().optional(),
})

export const unauthorizedResponseSchema = z.object({
  message: z.string(),
})

export const basicMessageResponseSchema = z.object({
  message: z.string(),
})
