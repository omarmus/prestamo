---
type: ADR (Architecture Decision Record)
title: @Inject() explícito en todos los constructores NestJS
description: Uso obligatorio de @Inject() en cada parámetro de constructor para compatibilidad con tsx/esbuild.
tags: [adr, nestjs, architecture, di]
timestamp: 2026-07-20T12:00:00-04:00
---

# @Inject() explícito en todos los constructores NestJS

## Contexto

NestJS usa `reflect-metadata` para resolver dependencias automáticamente vía `design:paramtypes`. Sin embargo, cuando se usa `tsx` (esbuild) como transpilador en desarrollo, `design:paramtypes` NO se emite. Esto causa que los parámetros del constructor se resuelvan como `undefined`.

## Decisión

**Siempre** usar `@Inject(Token)` en CADA parámetro del constructor de cualquier provider, service, repository, handler o controller de NestJS. Nunca confiar en la inyección implícita por tipo.

```ts
@Injectable()
export class MiService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(JwtService) private readonly jwt: JwtService,
  ) {}
}
```

## Consecuencias

- Funciona con cualquier transpilador (tsx, tsc, swc)
- Más verboso pero explícito — no depende de metadata de TypeScript
- Consistente en toda la codebase: 100% de los constructores usan @Inject()

## Aplicación

Commit `17d27aa` — fix: add explicit @Inject() decorators to all NestJS constructors.
