// ponytail: statusCode on the error instance drives DomainErrorFilter response mapping. No separate error-to-http mapper needed.

export class LoanNotFoundError extends Error {
  readonly statusCode = 404;
  readonly code = 'LOAN_NOT_FOUND';

  constructor(id: string) {
    super(`Préstamo no encontrado: ${id}`);
    this.name = 'LoanNotFoundError';
  }
}

export class LoanNotDisbursableError extends Error {
  readonly statusCode = 400;
  readonly code = 'LOAN_NOT_DISBURSABLE';

  constructor(identifier: string) {
    super(`La solicitud ${identifier} no está aprobada para desembolso`);
    this.name = 'LoanNotDisbursableError';
  }
}

export class LoanAlreadyDisbursedError extends Error {
  readonly statusCode = 409;
  readonly code = 'LOAN_ALREADY_DISBURSED';

  constructor() {
    super('Esta solicitud ya fue desembolsada');
    this.name = 'LoanAlreadyDisbursedError';
  }
}

export class LoanAlreadyPaidError extends Error {
  readonly statusCode = 409;
  readonly code = 'LOAN_ALREADY_PAID';

  constructor() {
    super('El préstamo ya está pagado');
    this.name = 'LoanAlreadyPaidError';
  }
}

export class PaymentNotFoundError extends Error {
  readonly statusCode = 404;
  readonly code = 'PAYMENT_NOT_FOUND';

  constructor(id: string) {
    super(`Pago no encontrado: ${id}`);
    this.name = 'PaymentNotFoundError';
  }
}

export class InstallmentNotFoundError extends Error {
  readonly statusCode = 404;
  readonly code = 'INSTALLMENT_NOT_FOUND';

  constructor(id: string) {
    super(`Cuota no encontrada: ${id}`);
    this.name = 'InstallmentNotFoundError';
  }
}

export class InstallmentAlreadyPaidError extends Error {
  readonly statusCode = 409;
  readonly code = 'INSTALLMENT_ALREADY_PAID';

  constructor(installmentNumber: number) {
    super(`La cuota #${installmentNumber} ya está pagada`);
    this.name = 'InstallmentAlreadyPaidError';
  }
}

export class InvalidPaymentAmountError extends Error {
  readonly statusCode = 400;
  readonly code = 'INVALID_PAYMENT_AMOUNT';

  constructor(message = 'El monto del pago debe ser mayor a 0') {
    super(message);
    this.name = 'InvalidPaymentAmountError';
  }
}

export class PartialPaymentNotSupportedError extends Error {
  readonly statusCode = 422;
  readonly code = 'PARTIAL_PAYMENT_NOT_SUPPORTED';

  constructor(amount: number, required: number) {
    super(`El monto (${amount}) debe ser al menos ${required} para cubrir la(s) cuota(s) pendiente(s). Pagos parciales no están soportados.`);
    this.name = 'PartialPaymentNotSupportedError';
  }
}

export class NoPendingInstallmentsError extends Error {
  readonly statusCode = 409;
  readonly code = 'NO_PENDING_INSTALLMENTS';

  constructor() {
    super('No hay cuotas pendientes por pagar');
    this.name = 'NoPendingInstallmentsError';
  }
}
