-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('LOAN_CONTRACT', 'PROMISSORY_NOTE');

-- CreateTable
CREATE TABLE "GeneratedDocument" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL DEFAULT 'LOAN_CONTRACT',
    "filePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL DEFAULT 'application/pdf',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GeneratedDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GeneratedDocument_loanId_key" ON "GeneratedDocument"("loanId");

-- CreateIndex
CREATE INDEX "GeneratedDocument_loanId_idx" ON "GeneratedDocument"("loanId");

-- AddForeignKey
ALTER TABLE "GeneratedDocument" ADD CONSTRAINT "GeneratedDocument_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
