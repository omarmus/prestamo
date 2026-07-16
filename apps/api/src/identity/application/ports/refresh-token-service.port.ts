export interface ConsumeResult {
  userId: string;
  familyId: string;
  role: string;
}

export interface RefreshTokenService {
  generate(userId: string): Promise<string>;
  consume(token: string): Promise<ConsumeResult | null>;
  revokeFamily(familyId: string): Promise<void>;
}
