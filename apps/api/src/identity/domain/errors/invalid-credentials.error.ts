export class InvalidCredentialsError extends Error {
  public readonly statusCode = 401;

  constructor() {
    super('Invalid email or password');
    this.name = 'InvalidCredentialsError';
  }
}
