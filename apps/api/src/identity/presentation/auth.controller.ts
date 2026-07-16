import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  UseGuards,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import type { TokenResponse, UserProfile } from '@prestamos/shared';

import { RegisterHandler } from '../application/register/register.handler';
import { RegisterCommand } from '../application/register/register.command';
import { LoginHandler } from '../application/login/login.handler';
import { LoginCommand } from '../application/login/login.command';
import { RefreshHandler } from '../application/refresh/refresh.handler';
import { RefreshCommand } from '../application/refresh/refresh.command';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import type { UserRepository } from '../domain/user.repository';
import type { PasswordHasher } from '../application/ports/password-hasher.port';
import type { JwtService } from '../application/ports/jwt-service.port';
import type { RefreshTokenService } from '../application/ports/refresh-token-service.port';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import type { JwtPayload } from '@prestamos/shared';
import {
  USER_REPOSITORY,
  PASSWORD_HASHER,
  JWT_SERVICE,
  REFRESH_TOKEN_SERVICE,
} from '../identity.module';

@Controller('api/auth')
export class AuthController {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
    @Inject(JWT_SERVICE) private readonly jwtService: JwtService,
    @Inject(REFRESH_TOKEN_SERVICE) private readonly refreshTokenService: RefreshTokenService,
  ) {}

  @Post('register')
  @HttpCode(201)
  async register(@Body() dto: RegisterDto): Promise<TokenResponse> {
    const handler = new RegisterHandler(
      this.userRepo,
      this.passwordHasher,
      this.jwtService,
      this.refreshTokenService,
    );
    return handler.execute(new RegisterCommand(dto.email, dto.password, dto.name, dto.phone));
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto): Promise<TokenResponse> {
    const handler = new LoginHandler(
      this.userRepo,
      this.passwordHasher,
      this.jwtService,
      this.refreshTokenService,
    );
    return handler.execute(new LoginCommand(dto.email, dto.password));
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(@Body() dto: RefreshDto): Promise<TokenResponse> {
    const handler = new RefreshHandler(this.refreshTokenService, this.jwtService);
    return handler.execute(new RefreshCommand(dto.refreshToken));
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async me(@CurrentUser() user: JwtPayload): Promise<UserProfile> {
    const userEntity = await this.userRepo.findById(user.sub);
    if (!userEntity) {
      throw new UnauthorizedException();
    }
    return userEntity.toProfile();
  }
}
