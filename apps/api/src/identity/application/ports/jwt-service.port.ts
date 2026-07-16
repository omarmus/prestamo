import type { JwtPayload } from '@prestamos/shared';

export interface JwtService {
  sign(payload: Omit<JwtPayload, 'iat' | 'exp'>): Promise<{ accessToken: string }>;
  verify(token: string): Promise<JwtPayload>;
}
