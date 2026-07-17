export class CustomerAlreadyExistsError extends Error {
  constructor(identifier: string) {
    super(`Customer already exists: ${identifier}`);
    this.name = 'CustomerAlreadyExistsError';
  }
}
