# Design: Phase 0 — Project Scaffold

> **Versiones actualizadas a Julio 2026** — verificadas con Context7.

| Paquete | Versión |
|---------|---------|
| Node.js | >=22.12 (LTS) |
| pnpm | 10.x |
| Next.js | 16.2.9 |
| React | 19.2.7 |
| NestJS | 11.1.16 |
| Prisma | 7.8.0 |
| Tailwind CSS | 4.1.x |
| Turborepo | 2.6.2 |
| shadcn/ui | 4.x |
| TypeScript | 5.9.x |
| Zod | latest |
| Argon2 | latest |
| jsonwebtoken | latest |
| PostgreSQL | 16-alpine (Docker) |
| Redis | 7-alpine (Docker) |

## 1. Technical Approach

**Monorepo**: Turborepo + pnpm workspaces (`apps/api`, `apps/web`, `packages/shared`). Nx es overkill para 2 apps — el skill `clean-ddd-hexagonal` dice "start simple".

**Modular Monolith DDD**: Un solo proceso NestJS con módulos DDD. Solo Identity en este cambio. Los otros dominios se agregan como módulos NestJS independientes en fases posteriores. La prueba de que las fronteras están bien: puedo testear los handlers sin infraestructura.

**Estructura Identity (Clean Architecture)**:

```
src/identity/
├── domain/                          # Capa más interna — 0 dependencias externas
│   ├── user.entity.ts               # Aggregate root
│   ├── email.value-object.ts        # VO — inmutabilidad por valor
│   ├── phone.value-object.ts        # VO Bolivia (+591 6/7XXXXXXX)
│   └── user.repository.ts           # Puerto (interfaz) — el adapter va en infra
├── application/                     # Casos de uso — orquestan dominio + side effects
│   ├── register/
│   │   ├── register.command.ts      # DTO de entrada
│   │   └── register.handler.ts      # Use case
│   ├── login/
│   │   ├── login.command.ts
│   │   └── login.handler.ts
│   └── refresh/
│       ├── refresh.command.ts
│       └── refresh.handler.ts
├── infrastructure/                  # Adaptadores — implementan puertos
│   ├── persistence/
│   │   ├── prisma-user.repository.ts
│   │   └── prisma/schema.prisma
│   └── auth/
│       ├── jwt.service.ts
│       └── refresh-token.service.ts  # Redis adapter
└── presentation/                    # Driver adapters (HTTP)
    ├── auth.controller.ts
    └── dto/
        ├── register.dto.ts
        ├── login.dto.ts
        └── refresh.dto.ts
```

**JWT Strategy**: Access token HS256 (15 min) + refresh token opaco (7 días, familia por device). Refresh rotation: cada refresh emite un nuevo par e invalida el anterior. Si un token ya consumido se reusa → revocación de toda la familia. Esto se implementa con una Redis Set por `familyId`; al rotar se agrega el nuevo, al detectar reuse se borra toda la familia.

## 2. Architecture Decisions

| Decisión | Opciones | Elegida | Por qué |
|----------|----------|---------|---------|
| Monorepo tool | Nx, Turborepo | **Turborepo** | Nx tiene más features pero para 2 apps es overkill. Build caching trivial con turbo. |
| ORM | Prisma, TypeORM, Drizzle | **Prisma** | Stack definido. Mejor DX de migraciones + schema-first. Drizzle tiene menos madurez en migrations. |
| Password hashing | bcrypt, argon2 | **argon2id** | Spec lo exige. Resistente a GPU cracking. Más lento (bueno para hashing, malo para DOS — rate limiter en el middleware HTTP). |
| Token strategy | Opaque session, JWT | **JWT access 15m + refresh 7d** | Stateless access (sin DB lookup), refresh rotation da revocación sin session store. |
| Refresh storage | PostgreSQL, Redis | **Redis** | Spec requiere family revocation. Redis TTL natural (EXPIRE en el token + Set para familia). |
| Validation | Zod, class-validator, Joi | **Zod** | Compartido entre API y web via `packages/shared`. Sin decorators (puro TypeScript). |
| JWT signing | RS256, HS256 | **HS256** | Simétrico. Para monolith modular alcanza. Si separamos servicios en el futuro, migrar a RS256. |
| CI | GH Actions, GitLab CI, CircleCI | **GH Actions** | Ya está en el repo. Ecosistema nativo, actions para setup-node + pnpm. |

## 3. Data Flow

**Register** — `POST /api/auth/register`:
```
Client → AuthController → RegisterHandler → EmailVO.create(email)
                                          → PhoneVO.create(phone)
                                          → User.create(name, email, phone, role=USER)
                                          → PasswordHasher.hash(password) // argon2id
                                          → UserRepo.save(user)
                                          → RefreshTokenService.generate(user.id, deviceId)
                                          → JwtService.sign({ sub: user.id, role: USER })
                                          ← { accessToken, refreshToken, user }
```

**Login** — `POST /api/auth/login`:
```
Client → AuthController → LoginHandler → UserRepo.findByEmail(email)
                                       → PasswordHasher.verify(hash, password) // argon2id
                                       → [Failed? → logAttempt(ip, timestamp) → 401]
                                       → RefreshTokenService.generate(user.id, deviceId)
                                       → JwtService.sign({ sub: user.id, role })
                                       ← { accessToken, refreshToken, user }
```

**Refresh** — `POST /api/auth/refresh`:
```
Client → AuthController → JwtAuthGuard → RefreshHandler → RefreshTokenService.consume(token)
                                                        → [Token consumed? → revoke family → 401]
                                                        → [Token valid?    → generate new pair]
                                                        → JwtService.sign({ sub: user.id, role })
                                                        ← { accessToken, refreshToken }
```

**Profile** — `GET /api/auth/me`:
```
Client → JwtAuthGuard → AuthController.me() → AuthController.response → UserProfile
         (valida JWT, extrae user)
```

## 4. File Changes

```
ROOT (9 files):
  package.json                          — pnpm workspace root, scripts: dev/build/lint
  pnpm-workspace.yaml                   — packages: ['apps/*', 'packages/*']
  turbo.json                            — pipeline: dev, build, lint, type-check
  tsconfig.base.json                    — strict: true, paths alias, target ES2022
  .eslintrc.js                          — import-boundary rules (domain→infra = error)
  .prettierrc                           — singleQuote, trailingComma all, printWidth 100
  .gitignore                            — node_modules, dist, .turbo, .env, prisma/generated
  docker-compose.yml                    — postgres:16-alpine (5432), redis:7-alpine (6379)
  .env.example                          — DATABASE_URL, REDIS_URL, JWT_SECRET

apps/api/ (22 files):
  package.json                          — @nestjs/core, @prisma/client, argon2, jsonwebtoken
  tsconfig.json                         — extends ../../tsconfig.base.json
  nest-cli.json                         — compilerOptions: tsConfigPath
  src/main.ts                           — bootstrap, ValidationPipe, CORS, port 3001
  src/app.module.ts                     — imports: IdentityModule, ConfigModule
  src/identity/domain/user.entity.ts    — id, email, name, phone, role, createdAt, passwordHash
  src/identity/domain/email.value-object.ts
  src/identity/domain/phone.value-object.ts
  src/identity/domain/user.repository.ts  — interface: save, findByEmail, findById
  src/identity/application/register/register.command.ts
  src/identity/application/register/register.handler.ts
  src/identity/application/login/login.command.ts
  src/identity/application/login/login.handler.ts
  src/identity/application/refresh/refresh.command.ts
  src/identity/application/refresh/refresh.handler.ts
  src/identity/infrastructure/persistence/prisma-user.repository.ts
  src/identity/infrastructure/persistence/prisma/schema.prisma  — User + Role models
  src/identity/infrastructure/persistence/prisma/prisma.service.ts
  src/identity/infrastructure/auth/jwt.service.ts
  src/identity/infrastructure/auth/refresh-token.service.ts
  src/identity/presentation/auth.controller.ts  — register/login/refresh/me
  src/identity/presentation/dto/register.dto.ts
  src/identity/presentation/dto/login.dto.ts
  src/identity/identity.module.ts
  src/shared/guards/jwt-auth.guard.ts
  src/shared/decorators/current-user.decorator.ts

apps/web/ (4 files):
  package.json                          — next, react, @packages/shared
  tsconfig.json                         — extends base + jsx: preserve
  next.config.ts                        — transpilePackages: ['@prestamos/shared']
  app/layout.tsx                        — HTML shell
  app/page.tsx                          — placeholder "Prestamos App"

packages/shared/ (5 files):
  package.json                          — zod dependency, name: @prestamos/shared
  tsconfig.json                         — extends base, outDir dist
  src/index.ts                          — re-exports all
  src/schemas/auth.schema.ts            — RegisterSchema, LoginSchema, RefreshSchema
  src/types/auth.types.ts               — TokenResponse, UserProfile, JwtPayload

.github/workflows/ci.yml               — setup-node + pnpm → lint → type-check → build
```

Total: **40+ archivos**

## 5. Interfaces / Contracts

```typescript
// API
POST /api/auth/register → 201 { accessToken, refreshToken, user }
POST /api/auth/login    → 200 { accessToken, refreshToken, user }
POST /api/auth/refresh  → 200 { accessToken, refreshToken }
GET  /api/auth/me       → 200 UserProfile  // Bearer token

// Zod schemas (shared package — mismo código en API y web)
RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2).max(100),
  phone: z.string().regex(/^\+591[67]\d{7}$/)   // +591 + 6/7 + 7 dígitos
});

LoginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

RefreshSchema = z.object({
  refreshToken: z.string()
});

// Types
TokenResponse = { accessToken: string; refreshToken: string; user: UserProfile }
UserProfile   = { id: string; email: string; name: string; phone: string; role: Role; createdAt: string }
JwtPayload    = { sub: string; role: string; iat: number; exp: number }
```

## 6. Testing Strategy

| Capa | Tipo | Qué probar |
|------|------|------------|
| Domain | Unit | EmailVO.parse(), PhoneVO.parse() — bordes y casos inválidos |
| Application | Unit | RegisterHandler (duplicado → 409, éxito → tokens), LoginHandler (wrong password → 401 genérico), RefreshHandler (reuse → family revocation) |
| Infrastructure | Integration | PrismaUserRepository (save + findByEmail), RefreshTokenService (generate + consume + reuse detection via Redis) |
| Presentation | E2E con supertest | POST /register → 201, POST /login → 200, POST /refresh → rotation, GET /me → profile, token expirado → 401 |

Regla DDD de la skill: testear handlers sin infra (mock del repository port). Los tests de integración solo para el adapter real.

## 7. Migration

**Comando**: `npx prisma migrate dev --name init`

**Modelos**:
```prisma
model Role {
  id        String   @id @default(uuid())
  name      String   @unique  // ADMIN, USER
  users     User[]
  createdAt DateTime @default(now())
}

model User {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String
  name         String
  phone        String
  roleId       String
  role         Role     @relation(fields: [roleId], references: [id])
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model FailedLoginAttempt {
  id        String   @id @default(uuid())
  email     String
  ip        String
  timestamp DateTime @default(now())
}
```

**Seed**: `prisma/seed.ts` crea rol ADMIN. Admin email/password desde env vars.
