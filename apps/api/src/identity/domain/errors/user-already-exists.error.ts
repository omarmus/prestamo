export class UserAlreadyExistsError extends Error {
  public readonly statusCode = 409;

  constructor(email: string) {
    super(`User with email ${email} already exists`);
    this.name = 'UserAlreadyExistsError';
  }
}
