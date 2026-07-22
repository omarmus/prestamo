import { Module, forwardRef } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import {
  STATS_QUERY,
  ADMIN_CUSTOMER_QUERY,
  ADMIN_NOTES_REPOSITORY,
} from './backoffice.tokens';
import { PrismaStatsQueryImpl } from './infrastructure/prisma-stats-query.impl';
import { PrismaAdminCustomerQueryImpl } from './infrastructure/prisma-admin-customer-query.impl';
import { PrismaAdminNotesRepositoryImpl } from './infrastructure/prisma-admin-notes-repository.impl';
import { GetStatsHandler } from './application/get-stats.handler';
import { GetCustomersHandler } from './application/get-customers.handler';
import { GetCustomerDetailHandler } from './application/get-customer-detail.handler';
import { CreateNoteHandler } from './application/create-note.handler';
import { GetNotesHandler } from './application/get-notes.handler';
import { ListAdminUsersHandler } from './application/list-admin-users.handler';
import { CreateAdminUserHandler } from './application/create-admin-user.handler';
import { AdminStatsController } from './presentation/admin-stats.controller';
import { AdminCustomerController } from './presentation/admin-customer.controller';
import { AdminNotesController } from './presentation/admin-notes.controller';
import { AdminUsersController } from './presentation/admin-users.controller';

@Module({
  imports: [forwardRef(() => IdentityModule)],
  controllers: [
    AdminStatsController,
    AdminCustomerController,
    AdminNotesController,
    AdminUsersController,
  ],
  providers: [
    { provide: STATS_QUERY, useClass: PrismaStatsQueryImpl },
    { provide: ADMIN_CUSTOMER_QUERY, useClass: PrismaAdminCustomerQueryImpl },
    { provide: ADMIN_NOTES_REPOSITORY, useClass: PrismaAdminNotesRepositoryImpl },
    GetStatsHandler,
    GetCustomersHandler,
    GetCustomerDetailHandler,
    CreateNoteHandler,
    GetNotesHandler,
    ListAdminUsersHandler,
    CreateAdminUserHandler,
  ],
})
export class BackofficeModule {}
