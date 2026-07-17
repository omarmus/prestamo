import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';

import { PrismaUserRepository } from './infrastructure/persistence/prisma-user.repository';
import { JwtServiceImpl } from './infrastructure/auth/jwt.service';
import { RefreshTokenServiceImpl } from './infrastructure/auth/refresh-token.service';
import { PasswordHasherService } from './infrastructure/auth/password-hasher.service';
import { JwtStrategy } from './infrastructure/auth/jwt.strategy';
import { redisProvider, REDIS_CLIENT } from './infrastructure/redis.provider';
import { AuthController } from './presentation/auth.controller';
import { CustomersModule } from '../customers/customers.module';
import {
  CUSTOMER_CREATOR,
} from '../customers/customers.tokens';
import {
  USER_REPOSITORY,
  PASSWORD_HASHER,
  JWT_SERVICE,
  REFRESH_TOKEN_SERVICE,
} from './identity.tokens';

@Module({
  imports: [
    forwardRef(() => CustomersModule),
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
    redisProvider,
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    { provide: PASSWORD_HASHER, useClass: PasswordHasherService },
    { provide: JWT_SERVICE, useClass: JwtServiceImpl },
    { provide: REFRESH_TOKEN_SERVICE, useClass: RefreshTokenServiceImpl },
    JwtStrategy,
  ],
  exports: [
    REDIS_CLIENT,
    USER_REPOSITORY,
    PASSWORD_HASHER,
    JWT_SERVICE,
    REFRESH_TOKEN_SERVICE,
  ],
})
export class IdentityModule {}
