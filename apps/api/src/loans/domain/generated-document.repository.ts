// Port interface — single source of truth for generated document persistence.
// Matches the Installment pattern (entity-free, Prisma-backed).
export interface GeneratedDocumentRepository {
  findByLoanId(loanId: string): Promise<GeneratedDocumentRow | null>;
  save(doc: Omit<GeneratedDocumentRow, 'id' | 'createdAt'>): Promise<GeneratedDocumentRow>;
}

// ponytail: Flat row type instead of domain entity — no behavior, no entity wrapper.
// Add domain entity only when document lifecycle logic emerges.
export interface GeneratedDocumentRow {
  id: string;
  loanId: string;
  type: string;
  filePath: string;
  mimeType: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}
