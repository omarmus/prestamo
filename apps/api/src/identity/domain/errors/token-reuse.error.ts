export class TokenReuseError extends Error {
  public readonly statusCode = 401;

  constructor() {
    super('Token has already been used — family revoked for security');
    this.name = 'TokenReuseError';
  }
}
