export class InvalidTokenError extends Error {
  public readonly statusCode = 401;

  constructor(message = 'Invalid or expired token') {
    super(message);
    this.name = 'InvalidTokenError';
  }
}
