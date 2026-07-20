import { Injectable, Inject } from '@nestjs/common';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import type { JwtPayload } from '@prestamos/shared';
import type { JwtService } from '../../application/ports/jwt-service.port';

@Injectable()
export class JwtServiceImpl implements JwtService {
  constructor(@Inject(NestJwtService) private readonly jwtService: NestJwtService) {}

  async sign(
    payload: Omit<JwtPayload, 'iat' | 'exp'>,
  ): Promise<{ accessToken: string }> {
    const accessToken = await this.jwtService.signAsync(payload);
    return { accessToken };
  }

  async verify(token: string): Promise<JwtPayload> {
    return this.jwtService.verifyAsync<JwtPayload>(token);
  }
}
