import type { Context } from "hono"
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { createDb } from '@/db'
import { users } from '@/db/schema'
import { sign } from 'hono/jwt'

export class AuthService {
    private db: ReturnType<typeof createDb>
    private c: Context

    constructor(c: Context){
        this.db = createDb(c)
        this.c = c
    }
    async login(username: string, password_from_user: string): Promise<string>{
    const user = await this.db.query.users.findFirst({
        where: eq(users.username, username),
    })
    if(!user){
        throw new Error('User not found')
    }

    const isPasswordValid = await bcrypt.compare(password_from_user, user.password)
    if(!isPasswordValid){
        throw new Error('Invalid Password')
    }

    const payload = {
        sub: user.id,
        role: user.user_type,
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24)
    }
    if(!this.c.env.JWT_SECRET){
        throw new Error('JWT_SECRET environment variable is not set!')
    }
    const token = await sign(payload, this.c.env.JWT_SECRET)
    return token
}
}

