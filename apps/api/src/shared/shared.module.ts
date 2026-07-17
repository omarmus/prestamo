import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { AuditService } from './audit/audit.service';
import { ConfigurationService } from './configuration/configuration.service';

@Global()
@Module({
  providers: [PrismaService, AuditService, ConfigurationService],
  exports: [PrismaService, AuditService, ConfigurationService],
})
export class SharedModule {}
