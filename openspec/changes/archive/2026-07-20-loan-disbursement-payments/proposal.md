# Proposal: Fase 5 — Préstamos Activos y Pagos

## Intent

Cuando un admin aprueba una solicitud de préstamo, el flujo termina — no hay préstamo activo, cuotas ni pagos. Esta fase cierra el ciclo: desembolso, cronograma de cuotas (sistema francés), y registro de pagos manuales.

## Scope

### In Scope

1. **Modelo de datos**: Tablas `Loan`, `Installment`, `LoanTransaction` en Prisma
2. **Desembolso**: Admin endpoint que crea préstamo activo + `n` cuotas desde una solicitud APPROVED
3. **Cálculo de amortización**: Sistema francés (cuota fija mensual) como utilidad de dominio
4. **Registro de pago**: Admin endpoint que marca cuota(s) como PAID, actualiza balance
5. **Portal cliente**: Lista de préstamos activos + detalle con cronograma de cuotas
6. **Portal admin**: Botón "Desembolsar" en review + lista de préstamos activos + registro de pago

### Out of Scope

- Pasarela de pagos real (QR, transferencia ACH, Tigo Money)
- Cálculo de mora / interés punitorio
- Notificaciones push/WhatsApp
- Pago parcial de cuotas (solo pago completo)
- Refinanciamiento, reestructuración, castigo
- Firma electrónica de contratos

## Capabilities

### New Capabilities

- `active-loan`: Gestión de préstamos activos (desembolso, consulta, listado)
- `installment-schedule`: Cronograma de cuotas (sistema francés, consulta)
- `payment-registration`: Registro manual de pagos (admin)

### Modified Capabilities

- `loan-application`: Se extiende el status `APPROVED` — ya no es terminal. La app aprobada habilita el desembolso en vez de quedar huérfana.
- `admin-review`: El review detail muestra botón "Desembolsar" cuando status es APPROVED.

## Approach

### Estrategia

Reusar la estructura DDD existente del módulo `loans/`. Agregar:

```
loans/
├── domain/
│   ├── loan.entity.ts              # Nueva entidad Loan (ACTIVE/PAID/DEFAULTED)
│   ├── installment.entity.ts       # Nueva entidad Installment (PENDING/PAID/OVERDUE)
│   ├── loan-transaction.vo.ts      # VO para transacciones financieras
│   ├── loan.repository.ts          # Puerto repositorio para Loan
│   ├── loan.errors.ts              # Errores de dominio para préstamos activos
│   └── value-objects/
│       ├── amortization.ts         # Cálculo de cuota fija francés + schedule
│       └── loan-status.ts          # Se agrega ACTIVE al enum (no transición)
├── application/
│   ├── ports/                      # Query ports para listar préstamos activos
│   ├── disburse-loan/              # DisburseLoanHandler
│   ├── register-payment/           # RegisterPaymentHandler
│   ├── get-active-loan/            # GetActiveLoanHandler
│   └── list-active-loans/          # ListActiveLoansHandler
├── infrastructure/
│   ├── persistence/prisma-loan.repository.ts
│   └── admin-query/                # Se extiende AdminQuery para active loans
├── presentation/
│   ├── active-loan.controller.ts   # Portal endpoints (GET /api/loans/active)
│   └── admin-payment.controller.ts # Admin endpoints (POST /api/admin/payments)
└── loans.tokens.ts                 # Nuevos tokens
```

### Flujo de desembolso

1. Admin aprueba → app.status = APPROVED (ya funciona)
2. Admin hace POST `/api/admin/loans/:id/disburse`
3. Handler: valida que app esté APPROVED → calcula schedule (francés) → tx crea Loan + Installments + LoanTransaction(DISBURSEMENT) → app.status = ACTIVE (nuevo estado)
4. LoanApplication.status se actualiza a ACTIVE (se agrega al enum)
5. LoanStatus agrega ACTIVE como estado válido que NO es transición desde APPROVED

### Cálculo de amortización francés

```
monthlyRate = annualRate / 12 / 100
cuota = P * [r(1+r)^n] / [(1+r)^n - 1]
interésMes = saldoRestante * r
amortizaciónMes = cuota - interésMes
```

Se genera el schedule completo al desembolsar y se persiste cada cuota.

### Schema Prisma

```prisma
model Loan {
  id              String   @id @default(uuid())
  applicationId   String   @unique
  application     LoanApplication @relation(fields: [applicationId], references: [id])
  customerId      String
  customer        Customer @relation(fields: [customerId], references: [id])
  amount          Decimal  @db.Decimal(18, 2)
  termMonths      Int
  annualRate      Decimal  @db.Decimal(10, 6)
  monthlyPayment  Decimal  @db.Decimal(18, 2)
  totalInterest   Decimal  @db.Decimal(18, 2)
  totalPayment    Decimal  @db.Decimal(18, 2)
  outstandingBalance Decimal @db.Decimal(18, 2)
  status          String   @default("ACTIVE") // ACTIVE | PAID | DEFAULTED | WRITTEN_OFF
  disbursedAt     DateTime @default(now())
  paidAt          DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  installments    Installment[]
  transactions    LoanTransaction[]

  @@index([customerId])
  @@index([status])
}

model Installment {
  id          String   @id @default(uuid())
  loanId      String
  loan        Loan     @relation(fields: [loanId], references: [id], onDelete: Cascade)
  number      Int      // 1-indexed
  dueDate     DateTime
  paidAt      DateTime?
  status      String   @default("PENDING") // PENDING | PAID | OVERDUE | PARTIAL

  amount      Decimal  @db.Decimal(18, 2)   // cuota fija
  interest    Decimal  @db.Decimal(18, 2)   // componente interés
  principal   Decimal  @db.Decimal(18, 2)   // componente capital
  balanceBefore Decimal @db.Decimal(18, 2)  // saldo antes de pagar
  balanceAfter  Decimal @db.Decimal(18, 2)  // saldo después de pagar

  payment     LoanTransaction?

  @@index([loanId, number])
  @@unique([loanId, number])
  @@index([status])
}

model LoanTransaction {
  id          String   @id @default(uuid())
  loanId      String
  loan        Loan     @relation(fields: [loanId], references: [id], onDelete: Cascade)
  type        String   // DISBURSEMENT | PAYMENT | ADJUSTMENT
  amount      Decimal  @db.Decimal(18, 2)
  method      String?  // MANUAL (por ahora, luego BANK_TRANSFER | QR | etc)
  installmentId String?
  installment Installment? @relation(fields: [installmentId], references: [id])
  reference   String?  // número de transacción externo
  notes       String?
  recordedById String
  recordedBy  User     @relation(fields: [recordedById], references: [id])
  createdAt   DateTime @default(now())

  @@index([loanId])
  @@index([type])
}
```

### Frontend cambios

- **Portal `/portal/loans`**: Mostrar tanto aplicaciones como préstamos activos. Nueva sección "Préstamos Activos" arriba, "Solicitudes" abajo.
- **Portal `/portal/loans/active/[id]`**: Detalle con cronograma de cuotas, próxima cuota, saldo pendiente.
- **Admin `/admin/loans/[id]`**: Botón "Desembolsar" cuando status=APPROVED.
- **Admin `/admin/payments`**: Lista de préstamos activos + modal para registrar pago.

### Ponytail decisions

- `ponytail`: El schedule de amortización se calcula inline en el handler desembolso, no como servicio separado. Extraer si hay múltiples métodos de amortización.
- `ponytail`: El registro de pago es MANUAL siempre en esta fase. El método se hardcodea en el DTO.
- `ponytail`: Loan no tiene evento de dominio — solo se persiste. Agregar Domain Events cuando haya side-effects (notificaciones, contabilidad).
- `ponytail`: No se persiste el detalle del cálculo (tabla de amortización completa en JSON). Se regenera desde las cuotas si es necesario.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `apps/api/prisma/schema.prisma` | **New** | Tablas `Loan`, `Installment`, `LoanTransaction` |
| `apps/api/src/loans/domain/` | **Modified** | Nuevos entity/vo: Loan, Installment, LoanTransaction, amortization calculator |
| `apps/api/src/loans/application/` | **New** | DisburseLoanHandler, RegisterPaymentHandler, ActiveLoan queries |
| `apps/api/src/loans/presentation/` | **New** | ActiveLoanController, AdminPaymentController |
| `apps/api/src/loans/loans.module.ts` | **Modified** | Registrar nuevos handlers y repos |
| `apps/api/src/loans/loans.tokens.ts` | **Modified** | Agregar LOAN_REPOSITORY token |
| `packages/shared/src/types/loan.types.ts` | **Modified** | Agregar ActiveLoanResponse, InstallmentResponse, PaymentInput |
| `packages/shared/src/schemas/loan.schema.ts` | **Modified** | Agregar DisburseSchema, RegisterPaymentSchema |
| `apps/web/features/loans/` | **Modified** | Nuevo hook useActiveLoans, componentes active-loan-list, active-loan-detail |
| `apps/web/features/admin/` | **Modified** | Nueva sección payments, botón desembolsar |
| `apps/web/app/portal/loans/` | **Modified** | Nueva ruta active/[id], actualizar page.tsx |
| `apps/web/app/admin/` | **Modified** | Nueva ruta payments/, actualizar loans/[id] |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Error en cálculo de amortización (interés compuesto vs simple, redondeo) | Medium | Tests unitarios en el cálculo puro. Verificar con casos conocidos (prestamo 10k a 12 meses 12%). Validar que suma de cuotas = totalPayment de la aplicación. |
| Race condition: dos disbursement requests simultáneos | Low | Transacción DB: verificar que app.status sea APPROVED dentro de la tx. Unique constraint en `Loan.applicationId` evita duplicados. |
| Datos financieros inconsistentes por error de redondeo acumulado | Low | El balanceAfter de la última cuota debe ser 0. Validar al desembolsar. Si difiere, ajustar la última cuota. |
| Schema migration conflict con Fases 0-4 existentes | Low | Migración downward-safe. Rollback con `prisma migrate down`. |

## Rollback Plan

**Prisma**: `prisma migrate down` revierte las nuevas tablas. No hay datos financieros en producción hasta el primer desembolso real.

**Backend**: Eliminar endpoints nuevos. Restaurar loans.module.ts anterior.

**Frontend**: Revertir rutas y componentes nuevos.

Sin migración destructiva — todas las tablas nuevas, columnas nuevas opcionales. Rollback no afecta loans existentes.

## Dependencies

- `apps/api/prisma/schema.prisma` debe tener las tablas `LoanApplication` y `Customer` (Fase 2-4 completadas). ✓

## Success Criteria

- [ ] Admin desembolsa un préstamo → se crea Loan + N Installments en DB con schedule correcto
- [ ] Cálculo de amortización francés: cuota fija, suma de intereses + capital = totalPayment, última cuota salda a 0
- [ ] Cliente ve su préstamo activo con cronograma en `/portal/loans/active/[id]`
- [ ] Admin registra pago → cuota marcada PAID, outstandingBalance actualizado
- [ ] Todas las cuotas pagadas → Loan.status = PAID
- [ ] Tests de aprobación con curl para endpoints nuevos
