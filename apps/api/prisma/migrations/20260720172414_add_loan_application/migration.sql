-- CreateTable
CREATE TABLE "LoanApplication" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "simulationId" TEXT,
    "amount" DECIMAL(18,2) NOT NULL,
    "termMonths" INTEGER NOT NULL,
    "annualRate" DECIMAL(10,6) NOT NULL,
    "monthlyPayment" DECIMAL(18,2) NOT NULL,
    "totalInterest" DECIMAL(18,2) NOT NULL,
    "totalPayment" DECIMAL(18,2) NOT NULL,
    "purpose" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "riskScore" TEXT,
    "timeline" JSONB,
    "reviewerId" TEXT,
    "reviewNotes" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoanApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LoanApplication_customerId_idx" ON "LoanApplication"("customerId");

-- CreateIndex
CREATE INDEX "LoanApplication_status_idx" ON "LoanApplication"("status");

-- CreateIndex
CREATE INDEX "LoanApplication_reviewerId_idx" ON "LoanApplication"("reviewerId");

-- CreateIndex
CREATE INDEX "LoanApplication_createdAt_idx" ON "LoanApplication"("createdAt");

-- AddForeignKey
ALTER TABLE "LoanApplication" ADD CONSTRAINT "LoanApplication_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanApplication" ADD CONSTRAINT "LoanApplication_simulationId_fkey" FOREIGN KEY ("simulationId") REFERENCES "LoanSimulation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanApplication" ADD CONSTRAINT "LoanApplication_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
