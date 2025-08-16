### Auth Routes

Route definitions and OpenAPI docs for authentication:

- `POST /auth/login`: `{ message, data }` on success; sets auth cookies.
- `POST /auth/refresh`: `{ message }`; refreshes access token via cookie.
- `POST /auth/logout`: `{ message }`; clears cookies and invalidates session.
- `GET /auth/me`: `{ message, data }`; returns `sub` and `role` from JWT.

Conventions:

- Request/response schemas use `@hono/zod-openapi`.
- Response shape standardized to improve client integration.

