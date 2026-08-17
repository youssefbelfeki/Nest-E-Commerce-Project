# Backend Technical Specifications & Strict Rules

This document outlines the strict API contracts, data models, guard behaviors, validation constraints, and response structures extracted directly from the NestJS backend implementation.

---

## 1. Core Server & Configuration

- **Base URL**: `http://localhost:3000` (or `process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'`)
- **Port**: `3000` (defined in `.env`)
- **Database**: PostgreSQL (Prisma ORM v7)

---

## 2. Response & Error Wrapping Format

### Success Responses (Global Interceptor)
All 2xx responses from NestJS are intercepted by `TransformInterceptor` (`src/users/transform/transform.interceptor.ts`) and wrapped in a standard envelope:

```typescript
interface ApiResponse<T> {
  status: 'success';
  data: T;
  timestamp: string; // ISO 8601 string
}
```

*Frontend Rule*: Every successful fetch call must unwrap response JSON via `json.data` to access the true payload.

### Error Responses
Error responses are returned with standard NestJS error shapes:

```typescript
interface ApiErrorResponse {
  statusCode: number;
  message: string | string[]; // Array if class-validator validation fails
  error: string;
}
```

Common status codes:
- `400 Bad Request`: Validation failure or business rule failure (e.g. insufficient stock).
- `401 Unauthorized`: Missing, invalid, or expired Bearer JWT token.
- `403 Forbidden`: Authenticated user lacks required role (e.g. NON-ADMIN calling `POST /products`).
- `409 Conflict`: Email already registered during `/auth/register`.
- `404 Not Found`: Resource does not exist.

---

## 3. Authentication & Security Pipeline

- **JWT Tokens**: Signed using `JWT_SECRET`. Payload contains `{ sub: userId (number), email: string, role: "USER" | "ADMIN" }`.
- **Authorization Header**:
  - Protected routes use NestJS `AuthGuard` which extracts token via:
    `Authorization: Bearer <accessToken>`
  - *Frontend Rule*: All requests to protected endpoints MUST attach `Authorization: Bearer <accessToken>` in the HTTP headers AND include `credentials: 'include'` in `fetch()` calls.

---

## 4. Entity Schemas & Models

### User Role Enum
`USER` | `ADMIN`

### User Model
- `id`: `number`
- `email`: `string`
- `name`: `string | null`
- `role`: `Role`

### Product Model
- `id`: `number`
- `name`: `string`
- `price`: `number` (Float)
- `stock`: `number` (Integer >= 0)

### Cart Item Model
- `id`: `number`
- `cartId`: `number`
- `productId`: `number`
- `quantity`: `number`
- `product`: `Product`

### Cart Model
- `id`: `number`
- `userId`: `number`
- `items`: `CartItem[]`

### Order Item Model
- `id`: `number`
- `orderId`: `number`
- `productId`: `number`
- `quantity`: `number`
- `product`: `Product`

### Order Model
- `id`: `number`
- `userId`: `number`
- `createdAt`: `string` (ISO DateTime)
- `items`: `OrderItem[]`

---

## 5. API Endpoints & Request Validation Constraints

### Authentication Routes (`/auth`)

#### `POST /auth/register`
- **Guards**: Public
- **Request Body (`RegisterDto`)**:
  - `name`: `string` (NotEmpty)
  - `email`: `string` (NotEmpty, IsEmail)
  - `password`: `string` (NotEmpty, MinLength: 6)
- **Response**: `{ status: "success", data: { id, email, name, role }, timestamp }`
- **Errors**: `409 ConflictException` ("Email is already in use")

#### `POST /auth/login`
- **Guards**: Public
- **Request Body (`LoginDto`)**:
  - `email`: `string` (NotEmpty, IsEmail)
  - `password`: `string` (NotEmpty)
- **Response**: `{ status: "success", data: { accessToken: string }, timestamp }`
- **Errors**: `401 UnauthorizedException` ("Invalid credentials")

---

### Product Routes (`/products`)
*Note*: `ProductsController` has `@UseGuards(AuthGuard, RolesGuard)` at controller level.

#### `GET /products`
- **Guards**: `AuthGuard`
- **Response**: `{ status: "success", data: Product[], timestamp }`

#### `GET /products/:id`
- **Guards**: `AuthGuard`
- **Response**: `{ status: "success", data: Product, timestamp }`

#### `POST /products`
- **Guards**: `AuthGuard`, `RolesGuard` (`@Roles(Role.ADMIN)`)
- **Request Body (`CreateProductDto`)**:
  - `name`: `string` (NotEmpty)
  - `price`: `number` (NotEmpty, Positive > 0)
  - `stock`: `number` (NotEmpty, Integer, Min: 0)
- **Response**: `{ status: "success", data: Product, timestamp }`

#### `PATCH /products/:id`
- **Guards**: `AuthGuard`, `RolesGuard` (`@Roles(Role.ADMIN)`)
- **Request Body (`UpdateProductDto`)**: Partial of `CreateProductDto` (`name?: string`, `price?: number`, `stock?: number`)
- **Response**: `{ status: "success", data: Product, timestamp }`

#### `DELETE /products/:id`
- **Guards**: `AuthGuard`, `RolesGuard` (`@Roles(Role.ADMIN)`)
- **Response**: `{ status: "success", data: Product, timestamp }`

---

### Cart Routes (`/cart`)

#### `GET /cart`
- **Guards**: `AuthGuard`
- **Response**: `{ status: "success", data: Cart | { items: [] }, timestamp }`

#### `POST /cart/add`
- **Guards**: `AuthGuard`
- **Request Body (`AddToCartDto`)**:
  - `productId`: `number` (Integer)
  - `quantity`: `number` (Integer, Min: 1)
- **Response**: `{ status: "success", data: CartItem, timestamp }`
- **Errors**: `400 BadRequestException` if stock is insufficient or product out of stock. `404 NotFoundException` if product missing.

#### `PATCH /cart/item/:id`
- **Guards**: `AuthGuard`
- **Request Body (`UpdateCartItemDto`)**:
  - `quantity`: `number` (Integer, Min: 1)
- **Response**: `{ status: "success", data: CartItem, timestamp }`

#### `DELETE /cart/item/:id`
- **Guards**: `AuthGuard`
- **Response**: `{ status: "success", data: CartItem, timestamp }`

---

### Order Routes (`/orders`)

#### `POST /orders`
- **Guards**: `AuthGuard`
- **Request Body (`CreateOrderDto`)**:
  - `items`: `Array<{ productId: number, quantity: number (Min: 1) }>` (ArrayMinSize: 1)
- **Behavior**: Atomically updates product stock in Prisma transaction.
- **Response**: `{ status: "success", data: Order, timestamp }`
- **Errors**: `400 BadRequestException` if any requested product stock is insufficient.

#### `GET /orders`
- **Guards**: `AuthGuard`
- **Response**: `{ status: "success", data: Order[], timestamp }` (Ordered by `createdAt` DESC)

#### `GET /orders/:id`
- **Guards**: `AuthGuard`
- **Response**: `{ status: "success", data: Order, timestamp }`
