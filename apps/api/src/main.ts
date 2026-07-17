import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { DomainErrorFilter } from './shared/filters/domain-error.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: ['http://localhost:3000'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      // ponytail: DTOs are plain classes without class-validator decorators.
      // Real validation happens via domain Value Objects in the handlers.
      // whitelist/forbidNonWhitelisted would strip all properties since none
      // are decorated. Just transform from plain to class instance.
    }),
  );

  app.useGlobalFilters(new DomainErrorFilter());

  const port = process.env.API_PORT ?? '3001';
  await app.listen(port);
  console.log(`API running on http://localhost:${port}`);
}

bootstrap();
