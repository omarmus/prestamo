import { randomBytes } from 'node:crypto';

export class RegisterCommand {
  constructor(
    public readonly email: string | null,
    public readonly password: string,
    public readonly name: string,
    public readonly phone: string,
  ) {}

  /** Create a command with auto-generated password (for chatbot registration). */
  static fromPhone(phone: string, name: string, email?: string): RegisterCommand {
    return new RegisterCommand(
      email ?? null,
      randomBytes(32).toString('hex'),
      name,
      phone,
    );
  }
}