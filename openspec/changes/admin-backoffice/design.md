# Design — Admin Backoffice

## 1. Architecture Decision

### Recommendation: BackofficeModule (standalone)

Create a new `BackofficeModule` at `apps/api/src/backoffice/` following Clean Architecture with 4 layers. Rationale:

- **Stats, notes, and users queries** are not owned by any existing module. Dashboard metrics span loans + customers + applications. Notes are a new entity. Admin user management is a different concern than identity auth flows.
- **Existing `loans` module** already houses admin loan controllers — those stay in `loans`. The `BackofficeModule` only handles functionality that has no natural home.
- **Reuses existing infrastructure**: `PrismaService` (from `SharedModule`), `AdminGuard` and `JwtAuthGuard` (from `loans` and `shared` respectively).
- **Additive**: No changes to existing flows. Import into `AppModule` and done.

```
apps/api/src/backoffice/
├── application/
│   ├── ports/
│   │   ├── stats-query.port.ts        # Interface for dashboard queries
│   │   ├── admin-customer-query.port.ts # Interface for customer admin queries
│   │   └── admin-notes-repository.port.ts # Interface for notes CRUD
│   ├── get-stats/
│   │   └── get-stats.handler.ts       # Orchestrates parallel count queries
│   ├── get-customers/
│   │   ├── get-customers.handler.ts
│   │   └── get-customer-detail.handler.ts
│   ├── create-note/
│   │   └── create-note.handler.ts
│   ├── get-notes/
│   │   └── get-notes.handler.ts
│   └── admin-users/
│       ├── create-admin-user.handler.ts
│       └── list-admin-users.handler.ts
├── domain/
│   └── admin-note.entity.ts           # (optional — thin entity, can skip for MVP)
├── infrastructure/
│   ├── prisma-stats-query.impl.ts     # Prisma implementation of StatsQuery
│   ├── prisma-admin-customer-query.impl.ts
│   └── prisma-admin-notes-repository.impl.ts
├── presentation/
│   ├── admin-stats.controller.ts
│   ├── admin-customer.controller.ts
│   ├── admin-notes.controller.ts
│   ├── admin-users.controller.ts
│   └── admin.guard.ts                 # Re-export from loans or shared
├── backoffice.module.ts
├── backoffice.tokens.ts               # DI tokens for ports
└── index.ts
```

### Why not extend `loans` or `customers` modules?

- Dashboard stats query belongs to neither — it reads Loan, LoanApplication, Customer, and User tables.
- Notes is a cross-cutting concern (relates to customers, loans, applications).
- Admin user management is separate from customer auth flows.
- A standalone module keeps cohesion high and coupling low.

---

## 2. Prisma — AdminNotes Model

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

- No `onDelete: Cascade` on `authorId` — if an admin user is ever deactivated, notes should retain author reference (`onDelete: NoAction` is default, which is fine — Prisma uses referential actions from the DB).
- `entityType` is a string enum validated at the application layer (Zod).
- `entityId` is not a foreign key — notes can point to any entity across modules.
- Migration: additive (`prisma migrate dev --create-only`), zero-downtime.

---

## 3. Backend Structure

### 3.1 Ports (application/ports/)

**stats-query.port.ts:**
```ts
export const STATS_QUERY = Symbol('STATS_QUERY');

export interface StatsQueryResult {
  totalApplications: number;
  pendingApplications: number;
  totalLoans: number;
  activeLoans: number;
  totalDisbursed: number;
  totalCustomers: number;
}

export interface StatsQuery {
  getStats(): Promise<StatsQueryResult>;
}
```

**admin-customer-query.port.ts:**
```ts
export const ADMIN_CUSTOMER_QUERY = Symbol('ADMIN_CUSTOMER_QUERY');

export interface AdminCustomerListFilters {
  search?: string;
  page: number;
  limit: number;
}

export interface AdminCustomerListItem {
  id: string;
  firstName: string;
  lastName: string | null;
  documentType: string | null;
  documentNumber: string | null;
  email: string | null;
  phone: string;
  status: string;
  kycStatus: string;
  createdAt: string;
}

export interface AdminCustomerDetailResult {
  customer: FullCustomerProfile & { user: { email: string | null; phone: string; name: string } };
  loans: Array<{ id: string; amount: number; status: string; outstandingBalance: number; disbursedAt: string }>;
  applications: Array<{ id: string; amount: number; status: string; createdAt: string }>;
}

export interface AdminCustomerQuery {
  list(filters: AdminCustomerListFilters): Promise<{ data: AdminCustomerListItem[]; total: number }>;
  getById(id: string): Promise<AdminCustomerDetailResult | null>;
}
```

**admin-notes-repository.port.ts:**
```ts
export const ADMIN_NOTES_REPOSITORY = Symbol('ADMIN_NOTES_REPOSITORY');

export interface AdminNoteRecord {
  id: string;
  authorId: string;
  authorName: string;
  entityType: string;
  entityId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminNotesRepository {
  create(data: { authorId: string; entityType: string; entityId: string; content: string }): Promise<AdminNoteRecord>;
  findByEntity(entityType: string, entityId: string): Promise<AdminNoteRecord[]>;
}
```

### 3.2 Handlers (application/)

Each handler is a plain class with a single public method. Simple enough to skip handler/command pattern — direct service-style classes.

**get-stats.handler.ts**: Injects `PrismaService`, runs 6 queries in parallel via `Promise.all`. No ports needed for this simplicity — can use PrismaService directly (`ponytail: direct Prisma access, extract to StatsQuery port if it grows`).

**get-customers.handler.ts**: Injects `ADMIN_CUSTOMER_QUERY`, delegates.

**get-customer-detail.handler.ts**: Injects `ADMIN_CUSTOMER_QUERY`, delegates.

**create-note.handler.ts**: Validates input via Zod, injects `ADMIN_NOTES_REPOSITORY`, creates note with `authorId` from JWT.

**get-notes.handler.ts**: Injects `ADMIN_NOTES_REPOSITORY`, returns notes for entity.

**create-admin-user.handler.ts**: Injects `USER_REPOSITORY` (from IdentityModule) and `PASSWORD_HASHER`. Looks up or creates ADMIN role, creates user.

**list-admin-users.handler.ts**: Injects `USER_REPOSITORY`, queries all users with role ADMIN.

### 3.3 Controllers (presentation/)

Each controller maps to a route prefix and uses `@UseGuards(JwtAuthGuard, AdminGuard)`.

| Controller | Route prefix |
|------------|-------------|
| `AdminStatsController` | `/api/admin/stats` |
| `AdminCustomerController` | `/api/admin/customers` |
| `AdminNotesController` | `/api/admin/notes` |
| `AdminUsersController` | `/api/admin/users` |

All guarded. Each controller method validates query/body with Zod pipes before calling the handler.

### 3.4 Module Wiring

```ts
// backoffice.module.ts
@Module({
  imports: [forwardRef(() => IdentityModule)],  // for USER_REPOSITORY
  controllers: [
    AdminStatsController,
    AdminCustomerController,
    AdminNotesController,
    AdminUsersController,
  ],
  providers: [
    // Ports
    { provide: STATS_QUERY, useClass: PrismaStatsQueryImpl },
    { provide: ADMIN_CUSTOMER_QUERY, useClass: PrismaAdminCustomerQueryImpl },
    { provide: ADMIN_NOTES_REPOSITORY, useClass: PrismaAdminNotesRepositoryImpl },
    // Handlers
    GetStatsHandler,
    GetCustomersHandler,
    GetCustomerDetailHandler,
    CreateNoteHandler,
    GetNotesHandler,
    CreateAdminUserHandler,
    ListAdminUsersHandler,
  ],
})
export class BackofficeModule {}
```

```ts
// app.module.ts — add BackofficeModule
@Module({
  imports: [
    ConfigModule.forRoot({ ... }),
    SharedModule,
    IdentityModule,
    CustomersModule,
    WhatsAppModule,
    PublicModule,
    LoansModule,
    BackofficeModule,  // new
  ],
})
export class AppModule {}
```

### 3.5 Guard — Reuse AdminGuard

The `AdminGuard` currently lives in `apps/api/src/loans/presentation/admin.guard.ts`. Two options:

1. **Re-export from loans module** (requires making it public in LoansModule exports).
2. **Move to shared/guards/** where `JwtAuthGuard` already lives.

**Recommendation**: Option 2 — move `AdminGuard` to `apps/api/src/shared/guards/admin.guard.ts` and update the import in `loans`. It's a 10-line class with no dependency on the loans module, so it belongs in shared.

---

## 4. Frontend Components

### 4.1 Component Tree

```
apps/web/
├── app/admin/
│   ├── layout.tsx                   # AdminLayout (auth guard + sidebar)
│   ├── page.tsx                     # Dashboard page (uses AdminDashboard)
│   ├── customers/
│   │   ├── page.tsx                 # Customer list (uses AdminCustomerTable)
│   │   └── [id]/page.tsx            # Customer detail (uses AdminCustomerDetail + NotesSection)
│   ├── users/
│   │   ├── page.tsx                 # Admin user list (uses AdminUserTable)
│   │   └── new/page.tsx             # Create user form (uses AdminUserForm)
│   └── loans/                       # Existing — no changes, sidebar links updated
└── features/admin/
    ├── components/
    │   ├── admin-sidebar.tsx        # Sidebar + mobile nav
    │   ├── metric-card.tsx          # Dashboard metric card
    │   ├── admin-dashboard.tsx      # Dashboard grid (composes MetricCard)
    │   ├── admin-customer-table.tsx # Searchable customer table
    │   ├── admin-customer-detail.tsx# Full customer profile sections
    │   ├── notes-section.tsx        # Notes list + add form
    │   ├── admin-user-table.tsx     # Admin user list table
    │   └── admin-user-form.tsx      # Create user form
    └── hooks/
        ├── use-admin-dashboard.ts   # GET /api/admin/stats
        ├── use-admin-customers.ts   # GET /api/admin/customers, GET /api/admin/customers/:id
        ├── use-admin-notes.ts       # GET/POST /api/admin/notes
        └── use-admin-users.ts       # GET /api/admin/users, POST /api/admin/users
```

### 4.2 Component Details

**AdminSidebar** (`features/admin/components/admin-sidebar.tsx`)
- `'use client'`. Props: `user`, `pathname`, `onLogout`.
- Pattern: identical to `PortalSidebar` but with admin nav items.
- Nav items: Dashboard, Solicitudes, Préstamos Activos, Clientes, Usuarios.
- Icons from lucide-react.
- Mobile: bottom nav + top bar with logout.

**MetricCard** (`features/admin/components/metric-card.tsx`)
- `interface MetricCardProps { title: string; value: string | number; icon: React.ElementType; isLoading?: boolean; }`
- Renders a `Card` with icon on the left, title above value.
- Skeleton shimmer while loading.

**AdminCustomerTable** (`features/admin/components/admin-customer-table.tsx`)
- Search input with debounce (300ms).
- shadcn/ui `<Table>` with columns: Nombre, Documento, Email, Teléfono, Estado, KYC, Creado.
- Pagination via shadcn `<Pagination>`.
- Empty state, loading state, error state.

**AdminCustomerDetail** (`features/admin/components/admin-customer-detail.tsx`)
- Sectioned `<Card>` layout for personal info, contact, employment, incomes, documents.
- Loan history section with table.
- Integrates `NotesSection` at the bottom.

**NotesSection** (`features/admin/components/notes-section.tsx`)
- Props: `entityType`, `entityId`.
- List of note cards (author, timestamp, content).
- Textarea + submit button at bottom.
- Optimistic update on add.

**AdminUserTable** (`features/admin/components/admin-user-table.tsx`)
- Simple `<Table>` with columns: Nombre, Email, Teléfono, Rol, Creado.
- "Crear Usuario" CTA button → link to `/admin/users/new`.

**AdminUserForm** (`features/admin/components/admin-user-form.tsx`)
- Form fields: name (`<Input>`), email (`<Input type="email">`), phone (`<Input>`), password (`<Input type="password">`).
- Client-side validation via Zod.
- Submit → `POST /api/admin/users` → redirect to `/admin/users`.

### 4.3 Hooks

Each hook follows the same pattern as `useAdminLoans`:
- State: `data`, `isLoading`, `error`
- Actions: async functions that call `api.get()` / `api.post()` from `@/lib/api-client`
- Typed with shared types from `@prestamos/shared`

---

## 5. Shared Types & Schemas

### New files in `packages/shared/src/`

**`packages/shared/src/types/admin.types.ts`**:

```ts
// === Dashboard ===
export interface AdminStatsResponse {
  totalApplications: number;
  pendingApplications: number;
  totalLoans: number;
  activeLoans: number;
  totalDisbursed: number;
  totalCustomers: number;
}

// === Customers ===
export interface AdminCustomerListItem {
  id: string;
  firstName: string;
  lastName: string | null;
  documentType: string | null;
  documentNumber: string | null;
  email: string | null;
  phone: string;
  status: string;
  kycStatus: string;
  createdAt: string;
}

export interface AdminCustomerListResponse {
  data: AdminCustomerListItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface AdminCustomerDetailResponse {
  customer: FullCustomerProfile & { user: { email: string | null; phone: string; name: string } };
  loans: Array<{ id: string; amount: number; status: string; outstandingBalance: number; disbursedAt: string }>;
  applications: Array<{ id: string; amount: number; status: string; createdAt: string }>;
}

// === Notes ===
export interface AdminNoteResponse {
  id: string;
  authorId: string;
  authorName: string;
  entityType: string;
  entityId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminNoteListResponse {
  data: AdminNoteResponse[];
}

export interface CreateNoteInput {
  entityType: 'CUSTOMER' | 'LOAN' | 'APPLICATION';
  entityId: string;
  content: string;
}

// === Admin Users ===
export interface AdminUserListItem {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: string;
  createdAt: string;
}

export interface AdminUserListResponse {
  data: AdminUserListItem[];
}

export interface CreateAdminUserInput {
  email: string;
  name: string;
  phone: string;
  password: string;
}
```

**`packages/shared/src/schemas/admin.schema.ts`**:

```ts
export const CreateNoteSchema = z.object({
  entityType: z.enum(['CUSTOMER', 'LOAN', 'APPLICATION']),
  entityId: z.string().uuid(),
  content: z.string().min(1).max(2000),
});

export const CreateAdminUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
  phone: z.string().regex(/^\+591[67]\d{7}$/),
  password: z.string().min(8),
});

export const AdminCustomerListQuerySchema = z.object({
  search: z.string().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
```

### Update `packages/shared/src/index.ts`

Add:
```ts
export * from './schemas/admin.schema';
export * from './types/admin.types';
```

---

## 6. Module Wiring Summary

### Backend

| Module | File | Change |
|--------|------|--------|
| `SharedModule` | `apps/api/src/shared/shared.module.ts` | No change (already global, exports PrismaService) |
| `LoansModule` | `apps/api/src/loans/loans.module.ts` | Move AdminGuard import to shared |
| `IdentityModule` | `apps/api/src/identity/identity.module.ts` | Export `USER_REPOSITORY`, `PASSWORD_HASHER` if not already |
| `BackofficeModule` | `apps/api/src/backoffice/backoffice.module.ts` | **New** |
| `AppModule` | `apps/api/src/app.module.ts` | Import `BackofficeModule` |

### Frontend

| File | Change |
|------|--------|
| `apps/web/app/admin/layout.tsx` | **New** — AdminLayout wrapper |
| `apps/web/app/admin/page.tsx` | **New** — Dashboard page |
| `apps/web/app/admin/customers/page.tsx` | **New** — Customer list |
| `apps/web/app/admin/customers/[id]/page.tsx` | **New** — Customer detail |
| `apps/web/app/admin/users/page.tsx` | **New** — User list |
| `apps/web/app/admin/users/new/page.tsx` | **New** — Create user |
| `apps/web/features/admin/components/*` | **New** — 7 components |
| `apps/web/features/admin/hooks/*` | **New** — 4 hooks |
| `apps/web/app/admin/loans/*` | **No change** — sidebar now navigates to them |

### Packages

| File | Change |
|------|--------|
| `packages/shared/src/types/admin.types.ts` | **New** — admin types |
| `packages/shared/src/schemas/admin.schema.ts` | **New** — admin Zod schemas |
| `packages/shared/src/index.ts` | **Modified** — export new modules |

---

## 7. Migration Plan

1. Add `AdminNote` model to `schema.prisma`
2. Run `prisma migrate dev --name add-admin-notes`
3. Create `packages/shared/src/types/admin.types.ts` and `packages/shared/src/schemas/admin.schema.ts`
4. Create `BackofficeModule` with ports, handlers, controllers, infrastructure
5. Move `AdminGuard` to `shared/guards/`
6. Wire `BackofficeModule` in `AppModule`
7. Create frontend admin layout + sidebar
8. Create dashboard page + metric cards
9. Create customer list + detail pages
10. Create notes section component + integrate in customer detail
11. Create admin user management pages
12. Test all endpoints with curl
13. Commit

## 8. Open Questions

- **AdminGuard location**: Move to shared/guards/ — yes/no? (Yes — cleaner, follows JwtAuthGuard precedent)
- **Dashboard metrics refresh**: On every page load (no caching for MVP). Add SWR/stale-while-revalidate later if dashboard becomes a bottleneck.
- **Notes for LOAN and APPLICATION entities**: Include `NotesSection` in loan detail pages as a follow-up or in this change? **In this change** — the schema supports it, the component is generic.
