import {
  Controller,
  Get,
  Post,
  Body,
  Inject,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { AdminGuard } from '../../shared/guards/admin.guard';
import { ZodValidationPipe } from '../../shared/pipes/zod-validation.pipe';
import { CreateAdminUserSchema } from '@prestamos/shared';
import type { CreateAdminUserInput } from '@prestamos/shared';
import { ListAdminUsersHandler } from '../application/list-admin-users.handler';
import { CreateAdminUserHandler } from '../application/create-admin-user.handler';

@Controller('api/admin/users')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminUsersController {
  constructor(
    @Inject(ListAdminUsersHandler) private readonly listHandler: ListAdminUsersHandler,
    @Inject(CreateAdminUserHandler) private readonly createHandler: CreateAdminUserHandler,
  ) {}

  @Get()
  list() {
    return this.listHandler.execute();
  }

  @Post()
  @HttpCode(201)
  create(
    @Body(new ZodValidationPipe(CreateAdminUserSchema)) body: CreateAdminUserInput,
  ) {
    return this.createHandler.execute(body);
  }
}
