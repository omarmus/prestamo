import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { IdentityModule } from './identity/identity.module';
import { SharedModule } from './shared/shared.module';
import { WhatsAppModule } from './whatsapp/whatsapp.module';
import { CustomersModule } from './customers/customers.module';
import { PublicModule } from './public/public.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),
    SharedModule,
    IdentityModule,
    CustomersModule,
    WhatsAppModule,
    PublicModule,
  ],
})
export class AppModule {}
