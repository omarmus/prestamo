export type Role = 'USER' | 'ADMIN';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: Role;
  createdAt: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
}

export interface JwtPayload {
  sub: string;
  role: string;
  iat: number;
  exp: number;
}
