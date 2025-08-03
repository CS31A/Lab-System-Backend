// db/seed.ts

import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import * as schema from './schema'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'

//make sure that the .env is not empty okay
const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set!')
}

const client = neon(connectionString)
const db = drizzle(client, { schema })

async function main() {
  console.log('Seeding database...')

  // The password we want for our test user
  const plainTextPassword = 'password123'

  // Hashing the password with bcrypt
  const hashedPassword = await bcrypt.hash(plainTextPassword, 10)
  console.log(`Password "${plainTextPassword}" has been hashed.`)

  // Deleting any existing user with this username to avoid errors when re runiing the seed
  console.log('Checking for existing user with username "testuser"...')

  await db.delete(schema.users).where(eq(schema.users.username, 'testuser'))
  console.log('Deleted any existing user.')

  // Creating our new test user with the HASHED password
  await db.insert(schema.users).values({
    username: 'testUser',
    email: 'test@example.com',
    user_type: 'admin',
    password: hashedPassword, // Storing the hashed password
  })

  console.log('Successfully created user "testuser".')
  console.log('You can now log in with:')
  console.log('  Username: testuser')
  console.log('  Password: password123')
  console.log('Seeding complete.')
}

main().catch((err) => {
  console.error('Error during seeding:', err)
  process.exit(1)
})