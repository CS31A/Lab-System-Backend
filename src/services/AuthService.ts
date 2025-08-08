import type { Context } from "hono"
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { createDb } from '@/db'
import { users, sessions } from '@/db/schema'
import { sign } from 'hono/jwt'
import { nanoid } from "nanoid"
import { AppBindings } from "@/lib/types/app-types"

export class AuthService {
    private db: ReturnType<typeof createDb>
    private c: Context<AppBindings>

    constructor(c: Context<AppBindings>) {
        this.db = createDb(c)
        this.c = c
    }
    async login(username: string, password_from_user: string) {
        const user = await this.db.query.users.findFirst({
            where: eq(users.username, username)
        })

        if (!user) {
            throw new Error('Invalid credentials')
        }

        const isPasswordValid = await bcrypt.compare(password_from_user, user.password)

        if (!isPasswordValid) {
            throw new Error('Invalid credentials')
        }
        const accessToken = await sign({
            sub: user.id,
            role: user.user_type,
            exp: Math.floor(Date.now() / 1000) + (15 * 60), // 1 hour
        }, this.c.env.JWT_SECRET)

        const refreshToken = nanoid(48)
        const refreshTokenExpiresAt = new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)) // 7 days)

        await this.db.insert(sessions).values({
            user_id: user.id,
            refreshToken: refreshToken,
            expiresAt: refreshTokenExpiresAt
        })

        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                username: user.username,
                role: user.user_type,
            }
        }

    }
    async refresh(refreshToken: string): Promise<string> {
        const session = await this.db.query.sessions.findFirst({
            where: eq(sessions.refreshToken, refreshToken),
            with: {
                user: true,
            },
        })
        if (!session) {
            throw new Error('Invalid refresh token')
        }
        const now = new Date()
        if (now > session.expiresAt) {
            await this.db.delete(sessions).where(eq(sessions.id, session.id))
            throw new Error('Refresh token expired')
        }
        const user = session.user
        if (!user) {
            await this.db.delete(sessions).where(eq(sessions.id, session.id))
            throw new Error('User for this session not found')
        }

        const newAccessToken = await sign({
            sub: user.id,
            role: user.user_type,
            exp: Math.floor(Date.now() / 1000) + (15 * 60),

        }, this.c.env.JWT_SECRET)
        return newAccessToken
    }

    async logout(refreshToken: string) {
        // The only logic is to find the session by its refresh token
        // and delete it from the database.
        await this.db.delete(sessions).where(eq(sessions.refreshToken, refreshToken));

        // We don't need to return anything. If it doesn't throw an error, it worked.
        return;
    }
}


