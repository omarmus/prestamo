import type { LoanStatus } from './value-objects/loan-status';

// ponytail: statusCode on the error instance drives DomainErrorFilter response mapping. No separate error-to-http mapper needed.

export class LoanStatusTransitionError extends Error {
  readonly statusCode = 409;
  readonly code = 'LOAN_STATUS_TRANSITION_ERROR';

  constructor(fromStatus: LoanStatus, toStatus: LoanStatus) {
    super(`No se puede cambiar el estado de ${fromStatus} a ${toStatus}`);
    this.name = 'LoanStatusTransitionError';
  }
}

export class LoanNotFoundError extends Error {
  readonly statusCode = 404;
  readonly code = 'LOAN_NOT_FOUND';

  constructor(identifier: string) {
    super(`Solicitud no encontrada: ${identifier}`);
    this.name = 'LoanNotFoundError';
  }
}

export class LoanNotOwnedByCustomerError extends Error {
  readonly statusCode = 404;
  readonly code = 'LOAN_NOT_OWNED';

  constructor(message = 'Solicitud no encontrada') {
    super(message);
    this.name = 'LoanNotOwnedByCustomerError';
  }
}

export class InsufficientIncomeError extends Error {
  readonly statusCode = 422;
  readonly code = 'INSUFFICIENT_INCOME';

  constructor(message = 'Debes registrar al menos un ingreso antes de enviar tu solicitud') {
    super(message);
    this.name = 'InsufficientIncomeError';
  }
}

export class MissingDocumentsError extends Error {
  readonly statusCode = 422;
  readonly code = 'MISSING_DOCUMENTS';

  constructor(message = 'El cliente debe tener CI_FRONT y CI_BACK en estado VERIFIED') {
    super(message);
    this.name = 'MissingDocumentsError';
  }
}

export class HighRiskLoanError extends Error {
  readonly statusCode = 422;
  readonly code = 'HIGH_RISK_LOAN';

  constructor(dti: number) {
    super(`El ratio DTI (${dti.toFixed(2)}) excede el límite permitido de 0.50`);
    this.name = 'HighRiskLoanError';
  }
}

export class LoanAlreadyReviewedError extends Error {
  readonly statusCode = 409;
  readonly code = 'LOAN_ALREADY_REVIEWED';

  constructor(message = 'La solicitud ya está siendo revisada por otro asesor') {
    super(message);
    this.name = 'LoanAlreadyReviewedError';
  }
}
