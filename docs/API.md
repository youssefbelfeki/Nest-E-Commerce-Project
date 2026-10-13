# API Reference

Base URL: `http://localhost:3002/api/v1`

All endpoints are prefixed with `/api/v1` via `app.setGlobalPrefix('api/v1')` in `apps/backend/src/main.ts`.

## Response Envelope

Every success response is wrapped by `TransformInterceptor`:

```json
{
  "status": "success",
  "data": <payload>,
  "timestamp": "2026-10-12T00:00:00.000Z"
}
```

Error responses use NestJS defaults:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

## Authentication

All protected routes expect `Authorization: Bearer <accessToken>`.

JWT payload shape:

```json
{ "sub": 1, "email": "user@example.com", "role": "USER" | "ADMIN" }
```

There are **two overlapping auth mechanisms** (documented as a known quirk):

- Custom guard at `src/users/auth/auth.guard.ts` — used by products, cart, orders controllers.
- Passport `JwtAuthGuard` at `src/auth/guards/jwt-auth.guard.ts` — used by users controller.

Both validate the same JWT. Future work: consolidate into one guard.

## Endpoints

### App

| Method | Path | Guard | Description |
|---|---|---|---|
| GET | `/` | Public | Health / hello string |

### Auth

| Method | Path | Guard | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Register a new user |
| POST | `/auth/login` | Public | Login, returns JWT |

**POST /auth/register**

Request:

```json
{ "name": "string", "email": "string", "password": "string (min 6 chars)" }
```

Responses:
- `201` — created user (envelope-wrapped)
- `409` — `"Email is already in use"`

**POST /auth/login**

Request:

```json
{ "email": "string", "password": "string" }
```

Responses:
- `200` — `{ "accessToken": "..." }`
- `401` — `"Invalid credentials"`

### Products

All routes guarded at class level with `AuthGuard` + `RolesGuard` (custom). Write operations additionally require `@Roles(Role.ADMIN)`.

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/products` | Any authenticated | List products |
| GET | `/products/:id` | Any authenticated | Get one product |
| POST | `/products` | ADMIN | Create product |
| PATCH | `/products/:id` | ADMIN | Update product |
| DELETE | `/products/:id` | ADMIN | Delete product |

**POST /products** — `CreateProductDto`

```json
{ "name": "string", "price": 10.99, "stock": 5 }
```

`price` must be positive; `stock` must be an integer ≥ 0.

**PATCH /products/:id** — `Partial<CreateProductDto>`

### Cart

All routes guarded with custom `AuthGuard` (any authenticated user). User ID extracted from JWT via `@User('id')`.

| Method | Path | Description |
|---|---|---|
| GET | `/cart` | Current user's cart |
| POST | `/cart/add` | Add item to cart |
| PATCH | `/cart/item/:id` | Update cart item quantity |
| DELETE | `/cart/item/:id` | Remove cart item |

**POST /cart/add** — `AddToCartDto`

```json
{ "productId": 1, "quantity": 2 }
```

Responses:
- `201` — created `CartItem`
- `400` — quantity exceeds stock or product out of stock
- `404` — product not found

**PATCH /cart/item/:id** — `UpdateCartItemDto` (`quantity` integer ≥ 1)

### Orders

All routes guarded with custom `AuthGuard`. Orders are scoped to the current user.

| Method | Path | Description |
|---|---|---|
| POST | `/orders` | Create order from items (atomic stock decrement) |
| GET | `/orders` | Current user's orders (newest first) |
| GET | `/orders/:id` | Single order (user-scoped) |

**POST /orders** — `CreateOrderDto`

```json
{
  "items": [
    { "productId": 1, "quantity": 2 }
  ]
}
```

`items` must have at least one entry; `quantity` integer ≥ 1.

Responses:
- `201` — created order
- `400` — insufficient stock (transaction rolls back)

### Users

Class-level `@UseGuards(JwtAuthGuard, RolesGuard)` + `TransformInterceptor`. All routes require `ADMIN` role.

| Method | Path | Description |
|---|---|---|
| POST | `/users` | Create user |
| GET | `/users` | List users |
| GET | `/users/:id` | Get one user |
| PATCH | `/users/:id` | Update user |
| DELETE | `/users/:id` | Delete user |

## Validation

Global `ValidationPipe({ whitelist: true, transform: true })` is applied in `main.ts`. Unknown properties are stripped; DTOs are transformed (e.g. query/route param coercion).

## CORS

Configured from `CORS_ORIGIN` (comma-separated), defaulting to `http://localhost:3000` with `credentials: true`.

## Sample Requests

```bash
# Register
curl -X POST http://localhost:3002/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com","password":"secret123"}'

# Login
curl -X POST http://localhost:3002/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"secret123"}'

# List products (authenticated)
curl http://localhost:3002/api/v1/products \
  -H "Authorization: Bearer $TOKEN"

# Create order
curl -X POST http://localhost:3002/api/v1/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"items":[{"productId":1,"quantity":2}]}'
```
