import { createRoute, z } from '@hono/zod-openapi'
import jsonContent, { jsonContentRequired } from '@/middleware/utils/json-content'
import * as httpStatusCodes from '@/openapi/http-status-codes'

const LoginBodySchema = z.object({
    username: z.string()
        .min(1,{message: 'Username is Required!'}),
    password: z.string()
    .min(1,{message: 'Password is Required!'})
})
//API contract, for clarity before writing the login logic
export const loginRoute = createRoute({
    tags: ['Auth'],
    method: 'post',
    path: '/login',
    request: {
        body: jsonContentRequired(
            LoginBodySchema,
            'The Credintials for user Login',
        ),
    },
    responses: {
        [httpStatusCodes.OK]: jsonContent(z.object({
            token: z.string(),
        }),
        'Login Successful, JWT returned',
        ),
        [httpStatusCodes.UNAUTHORIZED]: jsonContent(z.object({
            message: z.string(),

        }),
            'invalid crenditials'
        )

    }
})


