import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from './infrastructure/persistence/prisma/prisma.service';
import { PrismaUserRepository } from './infrastructure/persistence/prisma-user.repository';
import { JwtServiceImpl } from './infrastructure/auth/jwt.service';
import { RefreshTokenServiceImpl } from './infrastructure/auth/refresh-token.service';
import { PasswordHasherService } from './infrastructure/auth/password-hasher.service';
import { JwtStrategy } from './infrastructure/auth/jwt.strategy';
import { redisProvider } from './infrastructure/redis.provider';
import { AuthController } from './presentation/auth.controller';

// Injection tokens for port interfaces (interfaces don't exist at runtime,
// so we use string tokens for NestJS DI resolution).
export const USER_REPOSITORY = 'UserRepository';
export const PASSWORD_HASHER = 'PasswordHasher';
export const JWT_SERVICE = 'JwtService';
export const REFRESH_TOKEN_SERVICE = 'RefreshTokenService';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: '15m',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    PrismaService,
    redisProvider,
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    { provide: PASSWORD_HASHER, useClass: PasswordHasherService },
    { provide: JWT_SERVICE, useClass: JwtServiceImpl },
    { provide: REFRESH_TOKEN_SERVICE, useClass: RefreshTokenServiceImpl },
    JwtStrategy,
  ],
  exports: [
    USER_REPOSITORY,
    PASSWORD_HASHER,
    JWT_SERVICE,
    REFRESH_TOKEN_SERVICE,
    PrismaService,
  ],
})
export class IdentityModule {}
