# Graph Report - .  (2026-08-21)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 576 nodes · 916 edges · 44 communities (23 shown, 21 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6a9ecafb`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- PrismaService
- products.controller.ts
- users.controller.ts
- AuthContext.tsx
- cart.controller.ts
- scripts
- dependencies
- orders.controller.ts
- include
- compilerOptions
- compilerOptions
- devDependencies
- frontend/package.json
- devDependencies
- main.ts
- AppService
- test-data.ts
- JwtStrategy
- nest-cli.json
- auth.helper.ts
- eslint
- @eslint/eslintrc
- @eslint/js
- eslint-plugin-prettier
- frontend/eslint.config.mjs
- next.config.ts
- postcss.config.mjs
- globals
- jest
- @nestjs/schematics
- @nestjs/testing
- prettier
- source-map-support
- ts-jest
- ts-loader
- ts-node
- tsconfig-paths
- @types/bcrypt
- @types/express
- @types/jest
- typescript-eslint
- user.entity.ts

## God Nodes (most connected - your core abstractions)
1. `PrismaService` - 35 edges
2. `compilerOptions` - 23 edges
3. `useAuth()` - 17 edges
4. `compilerOptions` - 16 edges
5. `scripts` - 15 edges
6. `ProductsService` - 14 edges
7. `AuthModule` - 13 edges
8. `CreateProductDto` - 13 edges
9. `UsersService` - 13 edges
10. `CartService` - 12 edges

## Surprising Connections (you probably didn't know these)
- `exclude` --extends--> `!**/*.spec.ts`  [EXTRACTED]
  tsconfig.build.json → package.json
- `exclude` --extends--> `!**/node_modules/**`  [EXTRACTED]
  frontend/tsconfig.json → package.json
- `createMockedApp()` --references--> `test`  [EXTRACTED]
  test/helpers/create-app-mocked.ts → package.json
- `exclude` --extends--> `!**/node_modules/**`  [EXTRACTED]
  tsconfig.build.json → package.json
- `LoginPage()` --calls--> `useAuth()`  [EXTRACTED]
  frontend/src/app/login/page.tsx → frontend/src/context/AuthContext.tsx

## Import Cycles
- None detected.

## Communities (44 total, 21 thin omitted)

### Community 0 - "PrismaService"
Cohesion: 0.06
Nodes (36): Global, HttpCode, AuthController, Body, Controller, Post, AuthModule, Module (+28 more)

### Community 1 - "products.controller.ts"
Cohesion: 0.07
Nodes (25): IsNumber, IsPositive, Roles(), ROLES_KEY, RolesGuard, Injectable, CreateProductDto, IsInt (+17 more)

### Community 2 - "users.controller.ts"
Cohesion: 0.07
Nodes (24): JwtAuthGuard, Injectable, CreateUserDto, IsEmail, IsNotEmpty, IsString, MinLength, UpdateUserDto (+16 more)

### Community 3 - "AuthContext.tsx"
Cohesion: 0.12
Nodes (27): AdminProductsPage(), CartPage(), metadata, LoginPage(), OrdersPage(), Home(), ProductsPage(), RegisterPage() (+19 more)

### Community 4 - "cart.controller.ts"
Cohesion: 0.10
Nodes (21): CartController, mockCart, mockCartItem, mockCartService, Body, Controller, Delete, Get (+13 more)

### Community 5 - "scripts"
Cohesion: 0.06
Nodes (35): author, description, jest, coverageDirectory, moduleFileExtensions, moduleNameMapper, rootDir, testEnvironment (+27 more)

### Community 6 - "dependencies"
Cohesion: 0.06
Nodes (35): bcrypt, class-transformer, class-validator, dotenv, @nestjs/common, @nestjs/core, @nestjs/jwt, @nestjs/mapped-types (+27 more)

### Community 7 - "orders.controller.ts"
Cohesion: 0.09
Nodes (19): ArrayMinSize, IsArray, User, CreateOrderDto, OrderItemDto, IsInt, Min, OrdersController (+11 more)

### Community 8 - "include"
Cohesion: 0.08
Nodes (24): exclude, include, **/*.ts, collectCoverageFrom, !**/node_modules/**, !**/*.spec.ts, dist, !**/*.e2e-spec.ts (+16 more)

### Community 9 - "compilerOptions"
Cohesion: 0.08
Nodes (23): compilerOptions, allowSyntheticDefaultImports, baseUrl, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, forceConsistentCasingInFileNames (+15 more)

### Community 10 - "compilerOptions"
Cohesion: 0.11
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 11 - "devDependencies"
Cohesion: 0.12
Nodes (17): eslint-config-next, devDependencies, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node, @types/react, @types/react-dom (+9 more)

### Community 12 - "frontend/package.json"
Cohesion: 0.12
Nodes (15): dependencies, next, react, react-dom, name, private, scripts, build (+7 more)

### Community 13 - "devDependencies"
Cohesion: 0.13
Nodes (15): eslint-config-prettier, @nestjs/cli, devDependencies, eslint-config-prettier, @nestjs/cli, prisma, supertest, @types/passport-jwt (+7 more)

### Community 14 - "main.ts"
Cohesion: 0.18
Nodes (6): AppModule, Module, LoggerMiddleware, Injectable, TransformInterceptor, Injectable

### Community 15 - "AppService"
Cohesion: 0.29
Nodes (5): AppController, Controller, Get, AppService, Injectable

### Community 16 - "test-data.ts"
Cohesion: 0.25
Nodes (7): INVALID_EMAIL, LONG_NAME, SHORT_PASSWORD, TEST_ADMIN, TEST_PRODUCT, TEST_PRODUCT_2, TEST_USER

### Community 17 - "JwtStrategy"
Cohesion: 0.33
Nodes (3): JwtPayload, JwtStrategy, Injectable

### Community 18 - "nest-cli.json"
Cohesion: 0.33
Nodes (5): collection, compilerOptions, deleteOutDir, $schema, sourceRoot

### Community 19 - "auth.helper.ts"
Cohesion: 0.60
Nodes (4): AuthTokens, loginUser(), registerAndLogin(), registerUser()

### Community 20 - "eslint"
Cohesion: 0.67
Nodes (3): eslint, eslint, eslint

## Knowledge Gaps
- **172 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+167 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **21 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createMockedApp()` connect `scripts` to `PrismaService`?**
  _High betweenness centrality (0.342) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _172 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `PrismaService` be split into smaller, more focused modules?**
  _Cohesion score 0.05960705960705961 - nodes in this community are weakly interconnected._
- **Should `products.controller.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06868686868686869 - nodes in this community are weakly interconnected._
- **Should `users.controller.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07020408163265306 - nodes in this community are weakly interconnected._
- **Should `AuthContext.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11538461538461539 - nodes in this community are weakly interconnected._
- **Should `cart.controller.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09759759759759759 - nodes in this community are weakly interconnected._