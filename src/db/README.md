# Database Implementation

This directory contains the database implementation for the Lab System Backend, including schema definitions and database connection utilities.

## Database Connection Functions

### `createDb(c: Context)`

Creates a database connection using the Neon HTTP driver. This is suitable for most CRUD operations but has limitations when it comes to interactive transactions.

### `createServerlessDb(c: Context)`

Creates a database connection using the Neon WebSocket driver, which enables interactive transactions. This was implemented to address the limitations of the Neon HTTP driver.

#### Why We Need WebSocket Connections for Transactions

The Neon HTTP driver has limitations when it comes to interactive transactions. Specifically:

- It doesn't support interactive transactions that require multiple round trips to the database
- All operations in a transaction must be batched into a single HTTP request
- This makes complex transaction management difficult

The Neon WebSocket driver solves these limitations by:

- Maintaining a persistent connection to the database
- Allowing multiple round trips within a single transaction
- Supporting true interactive transactions

#### Usage in UserService

The `createServerlessDb` function is used in `UserService` to solve manual transaction management issues, particularly for:

1. Creating a user and their associated role (teacher, technical_staff, or admin) in a single transaction
2. Ensuring data consistency when creating related records
3. Properly rolling back changes if any part of the transaction fails

Example usage:

```typescript
const db = createServerlessDb(context)
// Now you can use interactive transactions
const result = await db.transaction(async (tx) => {
  // Multiple operations that need to be atomic
  const user = await tx.insert(users).values(userData).returning()
  const role = await tx.insert(roles).values(roleData).returning()
  return { user, role }
})
```

This implementation ensures that user creation and role assignment happen atomically, preventing data inconsistencies.
