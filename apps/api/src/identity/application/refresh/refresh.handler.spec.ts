import { RefreshHandler } from './refresh.handler';
import { RefreshCommand } from './refresh.command';
import { TokenReuseError } from '../../domain/errors/token-reuse.error';
import type { JwtService } from '../ports/jwt-service.port';
import type { RefreshTokenService } from '../ports/refresh-token-service.port';

describe('RefreshHandler', () => {
  let handler: RefreshHandler;
  let mockJwtService: jest.Mocked<JwtService>;
  let mockRefreshTokenService: jest.Mocked<RefreshTokenService>;

  beforeEach(() => {
    mockJwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
    };

    mockRefreshTokenService = {
      generate: jest.fn(),
      consume: jest.fn(),
      revokeFamily: jest.fn(),
    };

    handler = new RefreshHandler(mockRefreshTokenService, mockJwtService);
  });

  describe('scenario 7: successful token refresh (rotation)', () => {
    it('returns new tokens and rotates the refresh token', async () => {
      const consumeResult = {
        userId: 'user-123',
        familyId: 'family-456',
        role: 'USER',
      };

      mockRefreshTokenService.consume.mockResolvedValue(consumeResult);
      mockJwtService.sign.mockResolvedValue({ accessToken: 'new.jwt.token' });
      mockRefreshTokenService.generate.mockResolvedValue('new-refresh-token');

      const command = new RefreshCommand('valid-refresh-token');

      const result = await handler.execute(command);

      expect(result.accessToken).toBe('new.jwt.token');
      expect(result.refreshToken).toBe('new-refresh-token');

      expect(mockRefreshTokenService.consume).toHaveBeenCalledWith(
        'valid-refresh-token',
      );
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: 'user-123',
        role: 'USER',
      });
      expect(mockRefreshTokenService.generate).toHaveBeenCalledWith('user-123');
    });
  });

  describe('scenario 8: reused token triggers family revocation', () => {
    it('throws TokenReuseError when token was already consumed', async () => {
      mockRefreshTokenService.consume.mockResolvedValue(null);

      const command = new RefreshCommand('already-used-token');

      await expect(handler.execute(command)).rejects.toThrow(TokenReuseError);
      expect(mockJwtService.sign).not.toHaveBeenCalled();
      expect(mockRefreshTokenService.generate).not.toHaveBeenCalled();
    });
  });
});
