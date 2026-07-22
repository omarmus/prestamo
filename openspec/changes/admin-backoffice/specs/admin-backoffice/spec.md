# Spec — Admin Backoffice

## Capability 1: Admin Navigation Layout

### Requirements

1. **AdminLayout** — A shared layout component for all `/admin/*` pages.
   - Client component (`'use client'`).
   - Reads `useAuth()` for user info and `usePathname()` for active link highlight.
   - Redirects to `/login` if not authenticated.
   - Shows a loading spinner while auth state resolves.
   - Renders null if not authenticated to prevent flash of unprotected content.
   - Includes `<Toaster />` for notifications.

2. **AdminSidebar** — Desktop sidebar.
   - 64-column (`w-64`), `border-r bg-card p-4`, `hidden md:flex`.
   - Top: Avatar + user name/email (same pattern as `PortalSidebar`).
   - Nav items with icon (lucide-react):
     - Dashboard (`/admin`, `LayoutDashboard`)
     - Solicitudes (`/admin/loans`, `FileText`)
     - Préstamos Activos (`/admin/loans/active`, `CreditCard`)
     - Clientes (`/admin/customers`, `UserCircle`)
     - Usuarios (`/admin/users`, `Shield`)
     - Notas (omitted from sidebar — embedded in customer/loan detail pages)
   - `isActive` check: `pathname === href` or `pathname.startsWith(href + '/')` for section links.
   - Active state: `bg-primary text-primary-foreground`.
   - Inactive state: `text-muted-foreground hover:bg-accent hover:text-accent-foreground`.
   - Bottom: Separator + Logout button (calls `logout()` from `useAuth`).

3. **Mobile bottom nav**.
   - Same nav items as desktop, rendered as `fixed bottom-0 left-0 right-0 flex border-t bg-card md:hidden`.
   - Each item is a `flex-1 flex-col` centered link with icon + label.
   - Active state: `text-primary`.
   - Inactive: `text-muted-foreground`.

4. **Mobile top bar**.
   - Header with user name + logout button, `md:hidden`.
   - `flex items-center justify-between border-b px-4 py-3`.

5. **Main content area**.
   - `flex flex-1 flex-col`, children rendered in `<main className="flex-1 p-4 pb-20 md:pb-4">`.
   - `pb-20` compensates fixed bottom nav on mobile.

### File Locations

| File | Description |
|------|-------------|
| `apps/web/app/admin/layout.tsx` | AdminLayout (client component, auth guard, sidebar + content) |
| `apps/web/features/admin/components/admin-sidebar.tsx` | AdminSidebar component |

### Routes Covered

| Route | Page |
|-------|------|
| `/admin` | Dashboard |
| `/admin/loans` | Loan applications list |
| `/admin/loans/active` | Active loans list |
| `/admin/loans/active/[id]` | Active loan detail |
| `/admin/loans/[id]` | Loan application detail |
| `/admin/customers` | Customer search list |
| `/admin/customers/[id]` | Customer detail profile |
| `/admin/users` | Admin user list |
| `/admin/users/new` | Create admin user |

---

## Capability 2: Dashboard Metrics

### Backend — `GET /api/admin/stats`

Returns a JSON object with the following fields:

```ts
interface AdminStatsResponse {
  totalApplications: number;
  pendingApplications: number;
  totalLoans: number;
  activeLoans: number;
  totalDisbursed: number;   // sum of all loan amounts
  totalCustomers: number;
}
```

**Implementation notes:**
- All queries execute in parallel via `Promise.all`.
- Queries are simple `count()` or `aggregate()` — no joins, no subqueries.
- `totalDisbursed`: `aggregate({ _sum: { amount: true } })` on `Loan` table.
- Guarded by `@UseGuards(JwtAuthGuard, AdminGuard)`.

**Response example:**
```json
{
  "totalApplications": 120,
  "pendingApplications": 8,
  "totalLoans": 95,
  "activeLoans": 72,
  "totalDisbursed": 1250000.00,
  "totalCustomers": 85
}
```

### Frontend — Dashboard Page

- Route: `/admin` → `apps/web/app/admin/page.tsx`
- Client component using `useAdminDashboard()` hook.
- Layout: `<main className="p-8">` with title "Dashboard" and subtitle "Resumen del sistema".
- Metric cards in a grid: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`.
- Each metric card shows:
  - Icon (lucide-react)
  - Label (Spanish)
  - Value (formatted: currency for `totalDisbursed`, number for others)
  - Loading skeleton: `<Skeleton className="h-4 w-24" />` while loading.
- Error state: show `<p className="text-destructive">{error}</p>`.

**MetricCard component** (`features/admin/components/metric-card.tsx`):
```tsx
interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  isLoading?: boolean;
}
```

**MetricCards:**

| Label | Key | Icon | Format |
|-------|-----|------|--------|
| Total Solicitudes | `totalApplications` | `FileText` | number |
| Pendientes | `pendingApplications` | `Clock` | number |
| Total Préstamos | `totalLoans` | `CreditCard` | number |
| Préstamos Activos | `activeLoans` | `Activity` | number |
| Total Desembolsado | `totalDisbursed` | `DollarSign` | currency (Bs.) |
| Clientes Registrados | `totalCustomers` | `Users` | number |

---

## Capability 3: Customer Search & Detail

### Backend — `GET /api/admin/customers`

**Query Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `search` | string | No | Search term — matches `firstName`, `lastName`, `documentNumber`, `user.email` (`contains` + `mode: insensitive`) |
| `page` | number | No (default: 1) | Page number |
| `limit` | number | No (default: 20, max: 100) | Items per page |

**Zod Schema** (`packages/shared/src/schemas/customer.schema.ts`):
```ts
export const AdminCustomerListQuerySchema = z.object({
  search: z.string().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
```

**Response:**
```ts
interface AdminCustomerListResponse {
  data: AdminCustomerListItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

interface AdminCustomerListItem {
  id: string;
  firstName: string;
  lastName: string | null;
  documentType: string | null;
  documentNumber: string | null;
  email: string | null;       // from User.email
  phone: string;               // from User.phone
  status: string;
  kycStatus: string;
  createdAt: string;
}
```

### Backend — `GET /api/admin/customers/:id`

**Response:**
```ts
interface AdminCustomerDetailResponse {
  customer: {
    id: string;
    userId: string;
    firstName: string;
    lastName: string | null;
    documentType: string | null;
    documentNumber: string | null;
    birthDate: string | null;
    gender: string | null;
    maritalStatus: string | null;
    occupation: string | null;
    monthlyIncome: number | null;
    status: string;
    kycStatus: string;
    createdAt: string;
    updatedAt: string;
    user: {
      email: string | null;
      phone: string;
      name: string;
    };
    addresses: AddressResponse[];
    phones: PhoneResponse[];
    emails: EmailResponse[];
    employment: EmploymentResponse | null;
    incomes: IncomeResponse[];
    bankAccounts: BankAccountResponse[];
    documents: DocumentResponse[];
  };
  loans: Array<{
    id: string;
    amount: number;
    status: string;
    outstandingBalance: number;
    disbursedAt: string;
  }>;
  applications: Array<{
    id: string;
    amount: number;
    status: string;
    createdAt: string;
  }>;
}
```

Reuse existing `AddressResponse`, `PhoneResponse`, etc. from `customer.types.ts`.

### Frontend — Customer List Page

- Route: `/admin/customers` → `apps/web/app/admin/customers/page.tsx`
- Client component with `useAdminCustomers()` hook.
- Hooks interface:
  ```ts
  function useAdminCustomers() {
    // state
    list: AdminCustomerListItem[];
    pagination: Pagination | null;
    isLoading: boolean;
    error: string | null;

    // actions
    search(params: { search?: string; page?: number; limit?: number }): Promise<void>;
  }
  ```
- Search input: `<Input placeholder="Buscar por nombre, documento o email..." />` with debounce (300ms).
- Table columns: Name, Document, Email, Phone, Status, KYC Status, Created At, Actions (View link).
- Loading state: `<Skeleton>` rows.
- Empty state: "No se encontraron clientes" message.
- Pagination: `<Pagination>` component from shadcn/ui.
- Each row links to `/admin/customers/[id]`.

### Frontend — Customer Detail Page

- Route: `/admin/customers/[id]` → `apps/web/app/admin/customers/[id]/page.tsx`
- Sections (each in a `<Card>`):
  1. **Personal Info**: firstName, lastName, documentType+documentNumber, birthDate, gender, maritalStatus, occupation, monthlyIncome
  2. **Contact**: email, phones (with WhatsApp indicator), addresses
  3. **Employment**: employer, position, status, salary
  4. **Incomes**: source, amount, frequency
  5. **Documents**: type, status, file name, download link (future)
  6. **Loan History**: list of applications and loans with status
  7. **Notes**: `NotesSection` component (see Capability 4)
- Back link: `<Link href="/admin/customers">← Volver a Clientes</Link>`.

---

## Capability 4: Admin Notes

### Prisma Model

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

**Constraints:**
- `entityType` must be one of: `CUSTOMER`, `LOAN`, `APPLICATION`.
- `content` is plain text, max 2000 characters.
- No soft-delete — admin notes are permanent internal records.
- Cascade delete on `authorId` (if user deleted, note remains but `author` becomes null? No — `onDelete: SetNull` or keep User reference).
  - **Decision**: `onDelete: NoAction` — admin users are rarely deleted, and notes should retain author reference.

### Backend — `POST /api/admin/notes`

**Request body (Zod):**
```ts
export const CreateNoteSchema = z.object({
  entityType: z.enum(['CUSTOMER', 'LOAN', 'APPLICATION']),
  entityId: z.string().uuid(),
  content: z.string().min(1).max(2000),
});
```

**Response:**
```ts
interface AdminNoteResponse {
  id: string;
  authorId: string;
  authorName: string;
  entityType: string;
  entityId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}
```

### Backend — `GET /api/admin/notes`

**Query Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `entityType` | string | Yes | `CUSTOMER`, `LOAN`, or `APPLICATION` |
| `entityId` | string | Yes | UUID of the entity |

**Response:**
```ts
interface AdminNoteListResponse {
  data: AdminNoteResponse[];
}
```

Returned in descending order by `createdAt` (most recent first).

### Frontend — NotesSection

**Component** (`features/admin/components/notes-section.tsx`):
```tsx
interface NotesSectionProps {
  entityType: 'CUSTOMER' | 'LOAN' | 'APPLICATION';
  entityId: string;
}
```

- Displays a list of existing notes in a scrollable container.
- Each note shows: author name, timestamp (relative: "hace 2 horas"), content.
- Form at the bottom: `<Textarea>` + "Agregar Nota" button.
- `useAdminNotes()` hook:
  ```ts
  function useAdminNotes(entityType: string, entityId: string) {
    notes: AdminNoteResponse[];
    isLoading: boolean;
    error: string | null;
    addNote(content: string): Promise<void>;
    loadNotes(): Promise<void>;
  }
  ```
- Optimistic UI: append note immediately, re-fetch on error.
- Included in:
  - Customer detail page (`/admin/customers/[id]`)
  - Loan detail page (`/admin/loans/[id]` and `/admin/loans/active/[id]`)

---

## Capability 5: Admin User Management

### Backend — `GET /api/admin/users`

**Query Parameters:** None (list all admin users — expect small dataset).

**Response:**
```ts
interface AdminUserListResponse {
  data: AdminUserListItem[];
}

interface AdminUserListItem {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: string;
  createdAt: string;
  lastLogin: string | null;   // ponytail: from refresh token or session log — omit for MVP
}
```

**Implementation notes:**
- Query: `user.findMany({ where: { role: { name: 'ADMIN' } }, include: { role: true } })`.
- Maps to `AdminUserListItem` shape.

### Backend — `POST /api/admin/users`

Creates a new admin user (invites by email).

**Zod Schema** (`packages/shared/src/schemas/auth.schema.ts`):
```ts
export const CreateAdminUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
  phone: z.string().regex(/^\+591[67]\d{7}$/),
  password: z.string().min(8), // temporary password, user should change on first login
});
```

**Response:** `UserProfile` (from `auth.types.ts`).

**Implementation notes:**
- Reuses `PasswordHasherService` and `UserRepository` from IdentityModule.
- Creates user with role "ADMIN" — looks up `Role` by name or creates if not exists.
- No email sending for MVP (`ponytail: send invite email when mail service is ready`).
- Guarded by `@UseGuards(JwtAuthGuard, AdminGuard)`.

### Frontend — Admin Users List Page

- Route: `/admin/users` → `apps/web/app/admin/users/page.tsx`
- `useAdminUsers()` hook:
  ```ts
  function useAdminUsers() {
    list: AdminUserListItem[];
    isLoading: boolean;
    error: string | null;
    load(): Promise<void>;
  }
  ```
- Table columns: Name, Email, Phone, Role, Created At.
- "Crear Usuario" button → navigates to `/admin/users/new`.

### Frontend — Create Admin User Page

- Route: `/admin/users/new` → `apps/web/app/admin/users/new/page.tsx`
- Form with fields: name, email, phone, password.
- Validation: client-side Zod (reuse `CreateAdminUserSchema`) + server-side.
- On success: redirect to `/admin/users` with success toast.
- On error: inline error message.

---

## Error Handling (All Endpoints)

| Status | Scenario |
|--------|----------|
| `401` | Missing or invalid JWT |
| `403` | Authenticated but not ADMIN role |
| `400` | Validation error (Zod) |
| `404` | Customer/user/note not found |
| `409` | Duplicate phone/email on user creation |
| `500` | Unexpected error (log + return generic message) |

All admin endpoints use `@UseGuards(JwtAuthGuard, AdminGuard)`.

---

## Testing Scenarios

### Scenario 1: Dashboard loads with real data
1. Given there are customers, applications, and loans in the database
2. When a GET request is sent to `/api/admin/stats`
3. Then the response includes `totalApplications`, `pendingApplications`, `totalLoans`, `activeLoans`, `totalDisbursed`, `totalCustomers`
4. And all numeric values are non-negative
5. And the dashboard page renders metric cards with the correct values

### Scenario 2: Customer search with filters
1. Given there are customers with various names, documents, and emails
2. When a GET request is sent to `/api/admin/customers?search=Juan&page=1&limit=10`
3. Then the response contains only customers matching "Juan" in name, document, or email
4. And pagination metadata is present and accurate
5. And the frontend renders the filtered results in a table

### Scenario 3: Full customer detail
1. Given a customer exists with addresses, phones, incomes, documents, and loans
2. When a GET request is sent to `/api/admin/customers/:id`
3. Then the response includes all nested resources (addresses, phones, etc.)
4. And the frontend displays all sections correctly

### Scenario 4: Create and view notes
1. Given an authenticated admin user
2. When a POST request is sent to `/api/admin/notes` with `entityType=CUSTOMER`, `entityId`, and `content`
3. Then the response returns the created note with `id`, `authorName`, `content`, `createdAt`
4. When a GET request is sent to `/api/admin/notes?entityType=CUSTOMER&entityId=:id`
5. Then the response includes the previously created note
6. And notes are ordered by `createdAt` descending

### Scenario 5: Create admin user
1. Given an authenticated admin user
2. When a POST request is sent to `/api/admin/users` with valid `name`, `email`, `phone`, `password`
3. Then the response returns the created user's profile with role "ADMIN"
4. And the user can be found via `GET /api/admin/users`

### Scenario 6: Non-admin cannot access admin endpoints
1. Given an authenticated user with role "USER"
2. When a GET request is sent to any `/api/admin/*` endpoint
3. Then the response status is 403

### Scenario 7: Unauthenticated request is rejected
1. Given no JWT token
2. When a GET request is sent to any `/api/admin/*` endpoint
3. Then the response status is 401
