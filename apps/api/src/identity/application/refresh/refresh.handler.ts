import type { TokenResponse } from '@prestamos/shared';
import type { JwtService } from '../ports/jwt-service.port';
import type { RefreshTokenService } from '../ports/refresh-token-service.port';
import { TokenReuseError } from '../../domain/errors/token-reuse.error';
import { RefreshCommand } from './refresh.command';

export class RefreshHandler {
  constructor(
    private readonly refreshTokenService: RefreshTokenService,
    private readonly jwtService: JwtService,
  ) {}

  async execute(command: RefreshCommand): Promise<TokenResponse> {
    // 1. Try to consume the refresh token
    const result = await this.refreshTokenService.consume(command.refreshToken);

    // 2. If token was already consumed (null result) — reuse detected
    if (!result) {
      // ponytail: family revocation requires the familyId from the consumed token.
      // We cannot revoke the family without it at this layer. The refresh-token
      // service implementation should handle reuse detection internally and
      // revoke the family on detect. If it returns null, we only throw.
      throw new TokenReuseError();
    }

    // 3. Generate a new access token
    const { accessToken } = await this.jwtService.sign({
      sub: result.userId,
      role: result.role,
    });

    // 4. Generate a new refresh token (rotation)
    const refreshToken = await this.refreshTokenService.generate(result.userId);

    return {
      accessToken,
      refreshToken,
      // ponytail: user profile omitted from refresh response — not required by spec.
      // Add if clients need it.
    } as TokenResponse;
  }
}
