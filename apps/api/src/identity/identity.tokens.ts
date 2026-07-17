// Injection tokens for port interfaces (interfaces don't exist at runtime,
// so we use string tokens for NestJS DI resolution).
// Extracted to a separate file to avoid circular imports between
// identity.module.ts and auth.controller.ts.
export const USER_REPOSITORY = 'UserRepository';
export const PASSWORD_HASHER = 'PasswordHasher';
export const JWT_SERVICE = 'JwtService';
export const REFRESH_TOKEN_SERVICE = 'RefreshTokenService';
