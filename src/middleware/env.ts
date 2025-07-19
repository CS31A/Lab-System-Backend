import { ZodError } from "zod"
import { config } from "dotenv"
import { expand } from "dotenv-expand"
import { z } from "zod/mini"

expand(config())

const EnvSchema = z.object({
    DATABASE_URL: z.string(),
})

export type Env = z.infer<typeof EnvSchema>

let env: Env

try {
    env = EnvSchema.parse(process.env)
} catch (e) {
    const error = e as ZodError
    console.log('Invalid environment variables')
    console.error(z.treeifyError(error))
    process.exit(1)
}

export default env