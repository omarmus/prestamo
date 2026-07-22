# Tasks — Admin Backoffice

> **Change**: admin-backoffice
> **Project**: prestamos-app
> **Delivery strategy**: auto-forecast (4 chained PRs → main)

---

## PR 1 — Foundation (Backend Infrastructure)

### Prisma & Shared Types (~80 lines)

#### Task 1.1: Add AdminNote model to Prisma schema + generate migration

**File changes:**
| File | Change |
|------|--------|
| `apps/api/prisma/schema.prisma` | Add `model AdminNote { ... }` after `model AuditLog` |
| `apps/api/prisma/migrations/XXXX_add_admin_notes/` | Auto-generated via `prisma migrate dev --name add_admin_notes` |

**Model to add:**
```prisma
model AdminNote {
  id         String   @id @default(uuid())
  authorId   String
  author     User     @relation(fields: [authorId], references: [id])
  entityType String   // "CUSTOMER" | "LOAN" | "APPLICATION"
  entityId   String
  content    String
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@index([entityType, entityId])
  @@index([authorId])
}
```

**Acceptance criteria:**
- [ ] Migration runs successfully (`prisma migrate dev`)
- [ ] `prisma generate` produces the `AdminNote` client type
- [ ] Migration is additive — no existing data affected
- [ ] Rollback: `prisma migrate down` removes only this model

**Dependencies:** None

---

#### Task 1.2: Create shared admin types + schemas

**File changes:**
| File | Change |
|------|--------|
| `packages/shared/src/types/admin.types.ts` | **New** — all admin response/input types |
| `packages/shared/src/schemas/admin.schema.ts` | **New** — Zod schemas for admin endpoints |
| `packages/shared/src/index.ts` | **Modified** — add `export *` for new modules |

**Types to define** (in `admin.types.ts`):
- `AdminStatsResponse` — `totalApplications`, `pendingApplications`, `totalLoans`, `activeLoans`, `totalDisbursed`, `totalCustomers`
- `AdminCustomerListItem` — id, firstName, lastName, documentType, documentNumber, email, phone, status, kycStatus, createdAt
- `AdminCustomerListResponse` — `data: AdminCustomerListItem[]`, `pagination: { page, limit, total, totalPages }`
- `AdminCustomerDetailResponse` — `customer` (full profile + user), `loans[]`, `applications[]`
- `AdminNoteResponse` — id, authorId, authorName, entityType, entityId, content, createdAt, updatedAt
- `AdminNoteListResponse` — `data: AdminNoteResponse[]`
- `CreateNoteInput` — entityType, entityId, content
- `AdminUserListItem` — id, email, name, phone, role, createdAt
- `AdminUserListResponse` — `data: AdminUserListItem[]`
- `CreateAdminUserInput` — email, name, phone, password

**Schemas to define** (in `admin.schema.ts`):
- `CreateNoteSchema` — `entityType: z.enum(['CUSTOMER', 'LOAN', 'APPLICATION'])`, `entityId: z.string().uuid()`, `content: z.string().min(1).max(2000)`
- `CreateAdminUserSchema` — `email: z.string().email()`, `name: z.string().min(2).max(100)`, `phone: z.string().regex(/^\+591[67]\d{7}$/)`, `password: z.string().min(8)`
- `AdminCustomerListQuerySchema` — `search: z.string().max(100).optional()`, `page: z.coerce.number().int().min(1).default(1)`, `limit: z.coerce.number().int().min(1).max(100).default(20)`

**Acceptance criteria:**
- [ ] All types compile without errors
- [ ] Zod schemas parse valid input and reject invalid input
- [ ] `CreateAdminUserSchema` rejects non-Bolivian phones
- [ ] Types and schemas importable via `@prestamos/shared`

**Dependencies:** None

---

### Backoffice Module (~350 lines)

#### Task 1.3: Move AdminGuard to shared/guards/

**File changes:**
| File | Change |
|------|--------|
| `apps/api/src/shared/guards/admin.guard.ts` | **New** — moved from loans, no logic change |
| `apps/api/src/loans/presentation/admin.guard.ts` | **Deleted** |
| `apps/api/src/loans/loans.module.ts` | Update `AdminGuard` import path |
| `apps/api/src/shared/guards/jwt-auth.guard.ts` | No change |

**Guard content** (identical logic, new location):
```ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import type { JwtPayload } from '@prestamos/shared';

// ponytail: Basic role check. Add RBAC granular when more roles emerge.
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user: JwtPayload }>();
    return request.user?.role === 'ADMIN';
  }
}
```

**Acceptance criteria:**
- [ ] `AdminGuard` works from `shared/guards/` (new import path)
- [ ] LoansModule still compiles with updated import
- [ ] All existing admin loan endpoints still protected
- [ ] No duplicate `AdminGuard` class

**Dependencies:** None

---

#### Task 1.4: Create port interfaces (application/ports/)

**File changes:**
| File | Change |
|------|--------|
| `apps/api/src/backoffice/application/ports/stats-query.port.ts` | **New** |
| `apps/api/src/backoffice/application/ports/admin-customer-query.port.ts` | **New** |
| `apps/api/src/backoffice/application/ports/admin-notes-repository.port.ts` | **New** |
| `apps/api/src/backoffice/backoffice.tokens.ts` | **New** — DI token constants |

**Ports to define:**

`stats-query.port.ts`:
- `STATS_QUERY` token symbol
- `StatsQueryResult` interface (6 fields)
- `StatsQuery` interface with `getStats(): Promise<StatsQueryResult>`

`admin-customer-query.port.ts`:
- `ADMIN_CUSTOMER_QUERY` token
- `AdminCustomerListFilters` interface
- `AdminCustomerListItem` interface
- `AdminCustomerDetailResult` interface (nested customer + loans + applications)
- `AdminCustomerQuery` interface with `list()` and `getById()`

`admin-notes-repository.port.ts`:
- `ADMIN_NOTES_REPOSITORY` token
- `AdminNoteRecord` interface
- `AdminNotesRepository` interface with `create()` and `findByEntity()`

**Acceptance criteria:**
- [ ] All ports compile
- [ ] Types match the corresponding shared types from Task 1.2
- [ ] Tokens file contains all DI symbols

**Dependencies:** None

---

#### Task 1.5: Create Prisma infrastructure implementations

**File changes:**
| File | Change |
|------|--------|
| `apps/api/src/backoffice/infrastructure/prisma-stats-query.impl.ts` | **New** |
| `apps/api/src/backoffice/infrastructure/prisma-admin-customer-query.impl.ts` | **New** |
| `apps/api/src/backoffice/infrastructure/prisma-admin-notes-repository.impl.ts` | **New** |

`prisma-stats-query.impl.ts`:
- Injects `PrismaService` via `@Inject()`
- `getStats()`: 6 parallel count/aggregate queries:
  - `prisma.loanApplication.count()` for `totalApplications`
  - `prisma.loanApplication.count({ where: { status: 'PENDING' } })` for `pendingApplications`
  - `prisma.loan.count()` for `totalLoans`
  - `prisma.loan.count({ where: { status: 'ACTIVE' } })` for `activeLoans`
  - `prisma.loan.aggregate({ _sum: { amount: true } })` for `totalDisbursed`
  - `prisma.customer.count()` for `totalCustomers`
  - All parallel via `Promise.all`
- **ponytail**: direct Prisma access, extract to Gateway/DAO if queries grow complex

`prisma-admin-customer-query.impl.ts`:
- `list(filters)`: search by `firstName`, `lastName`, `documentNumber` via `contains + mode: insensitive`, join `user` for email match, paginate with `skip/take`
- `getById(id)`: find customer with all relations (`addresses`, `phones`, `emails`, `employment`, `incomes`, `bankAccounts`, `documents`, `loans`, `loanApplications`)
- Returns `AdminCustomerDetailResult` shape

`prisma-admin-notes-repository.impl.ts`:
- `create(data)`: `prisma.adminNote.create({ data, include: { author: true } })`, maps to `AdminNoteRecord`
- `findByEntity(entityType, entityId)`: `prisma.adminNote.findMany({ where: { entityType, entityId }, include: { author: true }, orderBy: { createdAt: 'desc' } })`, maps to `AdminNoteRecord[]`

**Acceptance criteria:**
- [ ] All implementations compile
- [ ] Stats queries return correct counts against real DB
- [ ] Customer search handles empty search term (returns all)
- [ ] Notes repository creates and retrieves records correctly

**Dependencies:** Task 1.1 (AdminNote model), Task 1.4 (ports)

---

#### Task 1.6: Create application handlers

**File changes:**
| File | Change |
|------|--------|
| `apps/api/src/backoffice/application/get-stats.handler.ts` | **New** |
| `apps/api/src/backoffice/application/get-customers.handler.ts` | **New** |
| `apps/api/src/backoffice/application/get-customer-detail.handler.ts` | **New** |
| `apps/api/src/backoffice/application/create-note.handler.ts` | **New** |
| `apps/api/src/backoffice/application/get-notes.handler.ts` | **New** |
| `apps/api/src/backoffice/application/list-admin-users.handler.ts` | **New** |
| `apps/api/src/backoffice/application/create-admin-user.handler.ts` | **New** |

`get-stats.handler.ts`:
- Injects `STATS_QUERY` via `@Inject(STATS_QUERY)`
- `execute()` → delegates to `statsQuery.getStats()`
- Maps `StatsQueryResult` to `AdminStatsResponse`

`get-customers.handler.ts`:
- Injects `ADMIN_CUSTOMER_QUERY` via `@Inject(ADMIN_CUSTOMER_QUERY)`
- `execute(filters)` → delegates to query, builds pagination metadata

`get-customer-detail.handler.ts`:
- Injects `ADMIN_CUSTOMER_QUERY`
- `execute(id)` → delegates, throws `NotFoundException` if null

`create-note.handler.ts`:
- Injects `ADMIN_NOTES_REPOSITORY`
- `execute(params)` where `params` includes `authorId` from JWT + validated input
- Passes through Zod-validated shape

`get-notes.handler.ts`:
- Injects `ADMIN_NOTES_REPOSITORY`
- `execute(entityType, entityId)` → returns list

`list-admin-users.handler.ts`:
- Injects `USER_REPOSITORY` (from IdentityModule — `@Inject(USER_REPOSITORY)`)
- `execute()`: queries users with role ADMIN, maps to `AdminUserListItem[]`

`create-admin-user.handler.ts`:
- Injects `USER_REPOSITORY` and `PASSWORD_HASHER` (both from IdentityModule)
- `execute(input)`: hashes password, looks up or creates ADMIN role, creates user, returns profile
- **ponytail**: no invite email sent — add when mail service is ready

**Acceptance criteria:**
- [ ] All handlers compile with `@Inject()` decorators
- [ ] Handlers delegate to correct ports
- [ ] `get-customer-detail.handler` throws 404 for missing customer
- [ ] `create-admin-user.handler` creates user with role ADMIN
- [ ] `create-admin-user.handler` returns existing ADMIN role (doesn't duplicate)

**Dependencies:** Task 1.4 (ports), Task 1.5 (infrastructure), IdentityModule tokens

---

#### Task 1.7: Create controllers (presentation/)

**File changes:**
| File | Change |
|------|--------|
| `apps/api/src/backoffice/presentation/admin-stats.controller.ts` | **New** |
| `apps/api/src/backoffice/presentation/admin-customer.controller.ts` | **New** |
| `apps/api/src/backoffice/presentation/admin-notes.controller.ts` | **New** |
| `apps/api/src/backoffice/presentation/admin-users.controller.ts` | **New** |

All controllers use `@UseGuards(JwtAuthGuard, AdminGuard)`.

| Controller | Route | Method | Handler |
|------------|-------|--------|---------|
| `AdminStatsController` | `GET /api/admin/stats` | `getStats()` | `GetStatsHandler` |
| `AdminCustomerController` | `GET /api/admin/customers` | `list(query)` | `GetCustomersHandler` |
| `AdminCustomerController` | `GET /api/admin/customers/:id` | `getById(param)` | `GetCustomerDetailHandler` |
| `AdminNotesController` | `GET /api/admin/notes` | `list(query)` | `GetNotesHandler` |
| `AdminNotesController` | `POST /api/admin/notes` | `create(body, req.user)` | `CreateNoteHandler` |
| `AdminUsersController` | `GET /api/admin/users` | `list()` | `ListAdminUsersHandler` |
| `AdminUsersController` | `POST /api/admin/users` | `create(body)` | `CreateAdminUserHandler` |

All controller methods use NestJS `@Query()`, `@Param()`, `@Body()`, `@Req()` decorators. Validation via Zod pipe pattern (or inline) matching shared schemas.

Import `AdminGuard` from `shared/guards/admin.guard`, `JwtAuthGuard` from `shared/guards/jwt-auth.guard`.

**Acceptance criteria:**
- [ ] All controllers compile
- [ ] Endpoints return correct status codes (200, 201 for POST notes)
- [ ] All endpoints return 401 without JWT
- [ ] All endpoints return 403 without ADMIN role
- [ ] Validation errors return 400

**Dependencies:** Task 1.6 (handlers), Task 1.3 (AdminGuard)

---

#### Task 1.8: Wire BackofficeModule + update AppModule

**File changes:**
| File | Change |
|------|--------|
| `apps/api/src/backoffice/backoffice.module.ts` | **New** — module definition |
| `apps/api/src/backoffice/index.ts` | **New** — barrel export |
| `apps/api/src/app.module.ts` | **Modified** — import `BackofficeModule` |

`backoffice.module.ts`:
- `imports: [forwardRef(() => IdentityModule)]` (for `USER_REPOSITORY`, `PASSWORD_HASHER`)
- `controllers: [AdminStatsController, AdminCustomerController, AdminNotesController, AdminUsersController]`
- `providers`: all 3 infrastructure implementations, all 7 handlers
- `exports`: none needed (no module depends on it)

`app.module.ts`:
- Add `BackofficeModule` to `imports` array (after `LoansModule`)

**Acceptance criteria:**
- [ ] AppModule compiles and starts
- [ ] All `/api/admin/*` routes are registered (verified via curl)
- [ ] No circular dependency errors
- [ ] `@Inject(USER_REPOSITORY)` resolves correctly in handlers

**Dependencies:** Tasks 1.1 through 1.7

---

## PR 2 — Admin Layout + Dashboard

### Admin Layout (~160 lines)

#### Task 2.1: Create AdminSidebar component

**File changes:**
| File | Change |
|------|--------|
| `apps/web/features/admin/components/admin-sidebar.tsx` | **New** |

Pattern: follow `features/portal/components/portal-sidebar.tsx` exactly.

- `'use client'`
- Props: `user: { name?: string; email?: string }`, `pathname: string`, `onLogout: () => void`
- Desktop sidebar: `w-64`, `border-r bg-card p-4`, `hidden md:flex`
- Top: Avatar with initials + user name/email
- Nav items (lucide-react icons):
  | Label | Route | Icon |
  |-------|-------|------|
  | Dashboard | `/admin` | `LayoutDashboard` |
  | Solicitudes | `/admin/loans` | `FileText` |
  | Préstamos Activos | `/admin/loans/active` | `CreditCard` |
  | Clientes | `/admin/customers` | `UserCircle` |
  | Usuarios | `/admin/users` | `Shield` |
- Active state: `bg-primary text-primary-foreground` (exact match for `/admin`, prefix for sections)
- Inactive state: `text-muted-foreground hover:bg-accent hover:text-accent-foreground`
- Bottom: `<Separator />` + Logout button
- Mobile bottom nav: `fixed bottom-0 left-0 right-0 border-t bg-card md:hidden`, flex nav items

**Acceptance criteria:**
- [ ] Component renders all 5 nav items
- [ ] Active link highlighted correctly
- [ ] Mobile nav visible on small screens, hidden on desktop
- [ ] Logout button calls `onLogout`
- [ ] Consistent styling with PortalSidebar

**Dependencies:** None

---

#### Task 2.2: Create AdminLayout

**File changes:**
| File | Change |
|------|--------|
| `apps/web/app/admin/layout.tsx` | **New** |

Pattern: follow `apps/web/app/portal/layout.tsx` exactly.

- `'use client'`
- Uses `useAuth()`, `useRouter()`, `usePathname()`
- Redirects to `/login` if not authenticated
- Loading spinner while auth resolves
- Renders `null` if not authenticated (prevents flash)
- `<AdminSidebar>` with user, pathname, logout
- Mobile top bar: user name + logout button, `md:hidden`
- Main content: `flex-1 p-4 pb-20 md:pb-4`
- `<Toaster />` from `@/components/atoms/ui/sonner`

**Critical**: The existing `apps/web/app/admin/loans/page.tsx` has its own `<main className="p-8">` wrapper. The new layout also wraps content in `<main>`. This means loan pages will have nested `<main>` elements. **Fix**: Remove `<main>` wrappers from existing admin pages when they render inside the layout, OR keep the layout's `<main>` minimal and let individual pages keep theirs. **Recommendation**: Remove the outer `<main>` from individual pages — the layout provides it.

**Existing admin pages that need `<main>` removal:**
- `apps/web/app/admin/loans/page.tsx` — change `<main className="p-8">` to `<div className="p-8">` (inside already has `children` from layout's `<main>`)
- (Check all existing admin loan pages for the same pattern)

**Acceptance criteria:**
- [ ] Layout renders sidebar on desktop, bottom nav on mobile
- [ ] Unauthenticated users redirected to `/login`
- [ ] `/admin/loans/*` pages render inside the layout without double `<main>`
- [ ] Loading spinner shows while auth resolves
- [ ] `<Toaster />` renders for notifications

**Dependencies:** Task 2.1, `useAuth` hook

---

### Dashboard (~120 lines)

#### Task 2.3: Create MetricCard component

**File changes:**
| File | Change |
|------|--------|
| `apps/web/features/admin/components/metric-card.tsx` | **New** |

```tsx
interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  isLoading?: boolean;
}
```

- Renders `Card` from shadcn/ui
- Layout: icon on left (lucide-react, `h-8 w-8 text-muted-foreground`), title above value on right
- Loading: `<Skeleton className="h-4 w-24" />` for value
- Value formatted as-is (string or number)

**Acceptance criteria:**
- [ ] Component renders card with icon, title, value
- [ ] Loading state shows skeleton
- [ ] Icon renders correctly from lucide-react

**Dependencies:** None

---

#### Task 2.4: Create dashboard page + hook

**File changes:**
| File | Change |
|------|--------|
| `apps/web/features/admin/hooks/use-admin-dashboard.ts` | **New** |
| `apps/web/app/admin/page.tsx` | **New** |
| `apps/web/features/admin/components/admin-dashboard.tsx` | **New** — dashboard grid (optional, can inline) |

`use-admin-dashboard.ts`:
- State: `stats: AdminStatsResponse | null`, `isLoading: boolean`, `error: string | null`
- `load()`: `api.get<AdminStatsResponse>('/api/admin/stats')`
- Returns `{ stats, isLoading, error, load }`

`apps/web/app/admin/page.tsx`:
- `'use client'`, uses `useAdminDashboard()`
- Calls `load()` on mount
- Title "Dashboard", subtitle "Resumen del sistema"
- Grid: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`
- 6 MetricCards:
  | Label | Key | Icon | Format |
  |-------|-----|------|--------|
  | Total Solicitudes | `totalApplications` | `FileText` | number |
  | Pendientes | `pendingApplications` | `Clock` | number |
  | Total Préstamos | `totalLoans` | `CreditCard` | number |
  | Préstamos Activos | `activeLoans` | `Activity` | number |
  | Total Desembolsado | `totalDisbursed` | `DollarSign` | currency (Bs.) |
  | Clientes Registrados | `totalCustomers` | `Users` | number |
- Loading: 6 skeleton cards
- Error: `text-destructive` message

**Acceptance criteria:**
- [ ] Dashboard loads stats from `/api/admin/stats`
- [ ] 6 metric cards render with real data
- [ ] `totalDisbursed` formatted as currency with "Bs." prefix
- [ ] Loading skeletons shown while fetching
- [ ] Error state rendered if API fails
- [ ] Dashboard accessible at `/admin`

**Dependencies:** Task 2.3 (MetricCard), Task 1.8 (BackofficeModule wired)

---

## PR 3 — Customer Browser + Notes

### Customer Backend (~200 lines existing from PR 1)

> Customer backend controllers and handlers were already created in PR 1 (Tasks 1.5-1.7). This PR adds only the frontend.

### Customer Frontend (~350 lines)

#### Task 3.1: Create useAdminCustomers hook

**File changes:**
| File | Change |
|------|--------|
| `apps/web/features/admin/hooks/use-admin-customers.ts` | **New** |

```ts
function useAdminCustomers() {
  // state
  list: AdminCustomerListItem[];
  detail: AdminCustomerDetailResponse | null;
  pagination: Pagination | null;
  isLoading: boolean;
  error: string | null;

  // actions
  search(params: { search?: string; page?: number; limit?: number }): Promise<void>;
  getDetail(id: string): Promise<void>;
}
```

- `search()`: calls `api.get<AdminCustomerListResponse>('/api/admin/customers?search=...&page=...&limit=...')`
- `getDetail()`: calls `api.get<AdminCustomerDetailResponse>('/api/admin/customers/:id')`

**Acceptance criteria:**
- [ ] Hook compiles and returns expected interface
- [ ] `search()` returns paginated results
- [ ] Empty search returns all customers (first page)
- [ ] Errors caught and surfaced as `error` string

**Dependencies:** Task 1.2 (shared types)

---

#### Task 3.2: Create CustomersTable component

**File changes:**
| File | Change |
|------|--------|
| `apps/web/features/admin/components/admin-customer-table.tsx` | **New** |

- Search input: `<Input placeholder="Buscar por nombre, documento o email..." />` with debounce (300ms)
- `<Table>` from shadcn/ui with columns: Nombre, Documento, Email, Teléfono, Estado, KYC, Creado
- Each row links to `/admin/customers/[id]`
- Pagination: `<Pagination>` from shadcn/ui (or simple prev/next)
- Loading state: skeleton rows
- Empty state: "No se encontraron clientes"
- Error state: inline error message

**Acceptance criteria:**
- [ ] Table renders with correct columns
- [ ] Search input filters with debounce
- [ ] Pagination controls visible and functional
- [ ] Loading/empty/error states render correctly
- [ ] Row links navigate to customer detail

**Dependencies:** Task 3.1 (hook)

---

#### Task 3.3: Create CustomerDetail component

**File changes:**
| File | Change |
|------|--------|
| `apps/web/features/admin/components/admin-customer-detail.tsx` | **New** |

Sectioned `<Card>` layout showing full customer profile:
1. **Información Personal**: firstName, lastName, documentType+documentNumber, birthDate, gender, maritalStatus, occupation, monthlyIncome
2. **Contacto**: email, phones (with WhatsApp indicator), addresses
3. **Empleo**: employer, position, employmentStatus, monthlySalary
4. **Ingresos**: source, amount, frequency (table)
5. **Documentos**: type, status, fileName (table)
6. **Historial de Préstamos**: table of applications (amount, status, createdAt) and loans (amount, status, outstandingBalance, disbursedAt)
7. **Notas**: `<NotesSection entityType="CUSTOMER" entityId={customer.id} />`

- Back link: `<Link href="/admin/customers">← Volver a Clientes</Link>`

**Acceptance criteria:**
- [ ] All sections render with customer data
- [ ] Empty sections show placeholder (e.g., "Sin información")
- [ ] Loan history shows both applications and loans
- [ ] Document list shows status badges
- [ ] Back link navigates to customer list

**Dependencies:** Task 3.4 (NotesSection), existing `customer.types.ts` types

---

#### Task 3.4: Create NotesSection component + hook

**File changes:**
| File | Change |
|------|--------|
| `apps/web/features/admin/hooks/use-admin-notes.ts` | **New** |
| `apps/web/features/admin/components/notes-section.tsx` | **New** |

`use-admin-notes.ts`:
```ts
function useAdminNotes(entityType: string, entityId: string) {
  notes: AdminNoteResponse[];
  isLoading: boolean;
  error: string | null;
  addNote(content: string): Promise<void>;
  loadNotes(): Promise<void>;
}
```
- `loadNotes()`: `api.get<AdminNoteListResponse>('/api/admin/notes?entityType=...&entityId=...')`
- `addNote(content)`: `api.post<AdminNoteResponse>('/api/admin/notes', { entityType, entityId, content })`
- Optimistic UI: append note immediately, re-fetch on error

`notes-section.tsx`:
- Props: `entityType: 'CUSTOMER' | 'LOAN' | 'APPLICATION'`, `entityId: string`
- List of existing notes: each shows author name, relative timestamp ("hace 2 horas"), content
- `<Textarea>` form + "Agregar Nota" button at bottom
- Empty state: "No hay notas registradas"
- Loading state

**Acceptance criteria:**
- [ ] Notes list loads on mount
- [ ] Add note button creates note via POST
- [ ] New note appears immediately (optimistic), or shows error if failed
- [ ] Empty state renders when no notes
- [ ] Component reused in customer detail page

**Dependencies:** Task 1.2 (shared types), Task 1.7 (notes endpoint)

---

#### Task 3.5: Create customer pages

**File changes:**
| File | Change |
|------|--------|
| `apps/web/app/admin/customers/page.tsx` | **New** |
| `apps/web/app/admin/customers/[id]/page.tsx` | **New** |

`apps/web/app/admin/customers/page.tsx`:
- `'use client'`, uses `useAdminCustomers()`
- Renders `<AdminCustomerTable>`
- Title: "Clientes", subtitle: "Buscar y gestionar clientes"

`apps/web/app/admin/customers/[id]/page.tsx`:
- `'use client'`, uses `useAdminCustomers()`, calls `getDetail(params.id)` on mount
- Renders `<AdminCustomerDetail>`
- Loading state, error state, not-found state

**Acceptance criteria:**
- [ ] `/admin/customers` renders searchable table
- [ ] Clicking a row navigates to `/admin/customers/[id]`
- [ ] `/admin/customers/[id]` renders full customer detail
- [ ] Notes section visible and functional in customer detail
- [ ] 404 shown for non-existent customer ID

**Dependencies:** Tasks 3.1–3.4

---

## PR 4 — Admin User Management

### Backend (~100 lines existing from PR 1)

> Admin user controllers and handlers were already created in PR 1. This PR adds only the frontend.

### Frontend (~200 lines)

#### Task 4.1: Create useAdminUsers hook

**File changes:**
| File | Change |
|------|--------|
| `apps/web/features/admin/hooks/use-admin-users.ts` | **New** |

```ts
function useAdminUsers() {
  list: AdminUserListItem[];
  isLoading: boolean;
  error: string | null;
  load(): Promise<void>;
  create(input: CreateAdminUserInput): Promise<UserProfile | null>;
}
```

- `load()`: `api.get<AdminUserListResponse>('/api/admin/users')`
- `create(input)`: `api.post<UserProfile>('/api/admin/users', input)`

**Acceptance criteria:**
- [ ] Hook compiles and returns expected interface
- [ ] `load()` fetches admin user list
- [ ] `create()` posts new user and returns profile
- [ ] Errors surfaced correctly

**Dependencies:** Task 1.2 (shared types)

---

#### Task 4.2: Create UsersTable component

**File changes:**
| File | Change |
|------|--------|
| `apps/web/features/admin/components/admin-user-table.tsx` | **New** |

- `<Table>` with columns: Nombre, Email, Teléfono, Rol, Creado
- "Crear Usuario" button → navigates to `/admin/users/new`
- Loading state: skeleton rows
- Empty state: "No hay usuarios administradores"
- No pagination (expect small dataset)

**Acceptance criteria:**
- [ ] Table renders with correct columns
- [ ] Create button navigates to `/admin/users/new`
- [ ] Loading/empty states render

**Dependencies:** Task 4.1 (hook)

---

#### Task 4.3: Create CreateUserForm component

**File changes:**
| File | Change |
|------|--------|
| `apps/web/features/admin/components/admin-user-form.tsx` | **New** |

- Form fields:
  - Name (`<Input>`)
  - Email (`<Input type="email">`)
  - Phone (`<Input>`)
  - Password (`<Input type="password">`)
- Client-side validation via Zod (`CreateAdminUserSchema` from `@prestamos/shared`)
- Submit → calls `useAdminUsers().create()` → on success redirect to `/admin/users` with success toast, on error show inline error
- `<Button type="submit">Crear Usuario</Button>` with loading state

**Acceptance criteria:**
- [ ] Form renders all 4 fields
- [ ] Client-side validation shows errors (invalid email, short password, bad phone format)
- [ ] Submit posts to `/api/admin/users`
- [ ] Success redirects to `/admin/users`
- [ ] Error shown inline on failure

**Dependencies:** Task 4.1 (hook), Task 1.2 (shared schemas)

---

#### Task 4.4: Create user management pages

**File changes:**
| File | Change |
|------|--------|
| `apps/web/app/admin/users/page.tsx` | **New** |
| `apps/web/app/admin/users/new/page.tsx` | **New** |

`apps/web/app/admin/users/page.tsx`:
- `'use client'`, uses `useAdminUsers()`, calls `load()` on mount
- Renders `<AdminUserTable>`
- Title: "Usuarios Administradores", subtitle: "Gestionar usuarios del sistema"

`apps/web/app/admin/users/new/page.tsx`:
- `'use client'`, renders `<AdminUserForm>`
- Title: "Crear Usuario", subtitle: "Agregar un nuevo administrador"

**Acceptance criteria:**
- [ ] `/admin/users` renders user table with data
- [ ] `/admin/users/new` renders create form
- [ ] Creating user redirects back to list with success toast
- [ ] Both pages render inside admin layout (PR 2)

**Dependencies:** Tasks 4.2, 4.3, PR 2 layout

---

## Review Workload Forecast

| PR | Areas | Est. Lines | Complexity | Risk | Chained PR Review |
|----|-------|-----------|------------|------|-------------------|
| **PR 1** | Prisma model, migration, shared types/schemas, BackofficeModule (ports, handlers, controllers, impl), AdminGuard move, DI wiring | ~430–480 | ⬜ **Medium** — many small files but clear pattern | **Low** — additive, no existing flow changes | Base PR — must be thoroughly reviewed for DI correctness (`@Inject()` everywhere), port contracts, and Prisma migration safety |
| **PR 2** | AdminSidebar, AdminLayout, MetricCard, Dashboard page + hook, fix nested `<main>` in existing loan pages | ~280–320 | ⬜ **Low** — copy portal pattern, well-defined | **Low** — pure additive UI, portal pattern already proven | Check layout auth guard matches portal, verify mobile nav, check nested `<main>` fix doesn't break loan pages |
| **PR 3** | Customer list/detail pages, CustomersTable, CustomerDetail, NotesSection + hook | ~350–400 | ⬜ **Medium** — larger components, NotesSection with optimistic UI | **Medium** — optimistic UI has failure edge cases | Review optimistic update pattern in notes, verify customer detail loads all nested relations, check empty/full states |
| **PR 4** | User list/create pages, UsersTable, CreateUserForm | ~180–220 | ⬜ **Low** — simple CRUD forms, small dataset | **Low** — straightforward pattern | Minimal, straightforward |

### Recommendations

1. **PR 1 first, always.** All other PRs depend on the backend infrastructure.
2. **PR 2 then PR 3 or PR 4** — layout is needed to navigate to customers/users pages. PR 3 and PR 4 are independent and can be parallelized if needed.
3. **Stacked PR chain**: PR 1 → PR 2 → PR 3 → PR 4, each merged to `main` sequentially.
4. **Review focus per PR:**
   - PR 1: `@Inject()` decorators on EVERY constructor param, port contract completeness, migration safety
   - PR 2: Auth guard in layout, mobile responsiveness, no double `<main>` in loan pages
   - PR 3: Optimistic update error handling, empty/null state coverage for customer fields
   - PR 4: Client-side Zod validation matches server schema, redirect flow works
5. **Curl testing required** (per project rule 5): Test each new endpoint after PR 1 before merging

### File Change Summary (All PRs)

**New files (~26):**

| File | PR |
|------|----|
| `packages/shared/src/types/admin.types.ts` | 1 |
| `packages/shared/src/schemas/admin.schema.ts` | 1 |
| `apps/api/src/shared/guards/admin.guard.ts` | 1 |
| `apps/api/src/backoffice/backoffice.module.ts` | 1 |
| `apps/api/src/backoffice/backoffice.tokens.ts` | 1 |
| `apps/api/src/backoffice/index.ts` | 1 |
| `apps/api/src/backoffice/application/ports/stats-query.port.ts` | 1 |
| `apps/api/src/backoffice/application/ports/admin-customer-query.port.ts` | 1 |
| `apps/api/src/backoffice/application/ports/admin-notes-repository.port.ts` | 1 |
| `apps/api/src/backoffice/application/get-stats.handler.ts` | 1 |
| `apps/api/src/backoffice/application/get-customers.handler.ts` | 1 |
| `apps/api/src/backoffice/application/get-customer-detail.handler.ts` | 1 |
| `apps/api/src/backoffice/application/create-note.handler.ts` | 1 |
| `apps/api/src/backoffice/application/get-notes.handler.ts` | 1 |
| `apps/api/src/backoffice/application/list-admin-users.handler.ts` | 1 |
| `apps/api/src/backoffice/application/create-admin-user.handler.ts` | 1 |
| `apps/api/src/backoffice/infrastructure/prisma-stats-query.impl.ts` | 1 |
| `apps/api/src/backoffice/infrastructure/prisma-admin-customer-query.impl.ts` | 1 |
| `apps/api/src/backoffice/infrastructure/prisma-admin-notes-repository.impl.ts` | 1 |
| `apps/api/src/backoffice/presentation/admin-stats.controller.ts` | 1 |
| `apps/api/src/backoffice/presentation/admin-customer.controller.ts` | 1 |
| `apps/api/src/backoffice/presentation/admin-notes.controller.ts` | 1 |
| `apps/api/src/backoffice/presentation/admin-users.controller.ts` | 1 |
| `apps/web/features/admin/components/admin-sidebar.tsx` | 2 |
| `apps/web/features/admin/components/metric-card.tsx` | 2 |
| `apps/web/features/admin/components/admin-dashboard.tsx` | 2 |
| `apps/web/features/admin/hooks/use-admin-dashboard.ts` | 2 |
| `apps/web/app/admin/layout.tsx` | 2 |
| `apps/web/app/admin/page.tsx` | 2 |
| `apps/web/features/admin/hooks/use-admin-customers.ts` | 3 |
| `apps/web/features/admin/hooks/use-admin-notes.ts` | 3 |
| `apps/web/features/admin/components/admin-customer-table.tsx` | 3 |
| `apps/web/features/admin/components/admin-customer-detail.tsx` | 3 |
| `apps/web/features/admin/components/notes-section.tsx` | 3 |
| `apps/web/app/admin/customers/page.tsx` | 3 |
| `apps/web/app/admin/customers/[id]/page.tsx` | 3 |
| `apps/web/features/admin/hooks/use-admin-users.ts` | 4 |
| `apps/web/features/admin/components/admin-user-table.tsx` | 4 |
| `apps/web/features/admin/components/admin-user-form.tsx` | 4 |
| `apps/web/app/admin/users/page.tsx` | 4 |
| `apps/web/app/admin/users/new/page.tsx` | 4 |

**Modified files (~8):**

| File | PR | Change |
|------|----|--------|
| `apps/api/prisma/schema.prisma` | 1 | Add `AdminNote` model |
| `packages/shared/src/index.ts` | 1 | Export `admin.types` and `admin.schema` |
| `apps/api/src/loans/loans.module.ts` | 1 | Update `AdminGuard` import path |
| `apps/api/src/app.module.ts` | 1 | Import `BackofficeModule` |
| `apps/web/app/admin/loans/page.tsx` | 2 | Remove outer `<main>` wrapper (now provided by layout) |
| *(other loan pages if they have `<main>`)* | 2 | Same fix |
| `apps/api/src/loans/presentation/admin.guard.ts` | 1 | **Deleted** (moved to shared) |

**Deleted files (1):**

| File | PR |
|------|----|
| `apps/api/src/loans/presentation/admin.guard.ts` | 1 |
