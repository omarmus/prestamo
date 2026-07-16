---
type: ADR
title: Technology Stack Choices
description: Justificación de NestJS, Next.js, Prisma, Turborepo, JWT con refresh rotation.
tags: [adr, stack, decisions]
timestamp: 2026-07-16T12:00:00-04:00
---

# ADR: Technology Stack Choices

## Context

Se necesita un stack moderno, type-safe y productivo para una fintech en Bolivia. El equipo es pequeño y valora productividad sin sacrificar calidad.

## Decisiones

### NestJS sobre Express/Fastify
- DI nativa, decoradores, modular — estructura limpia desde el día 1
- Cercano a la arquitectura limpia por su sistema de módulos/proveedores
- Ecosistema maduro para Passport, JWT, config

### Next.js 16 sobre CRA/Vite
- App Router con server components para landing pública
- API routes opcionales para BFF
- Ecosistema React + shadcn/ui

### Prisma sobre TypeORM/Drizzle
- Schema declarativo, type-safe por generación
- Migraciones confiables, Studio para debugging
- Madurez para PostgreSQL

### Turborepo sobre Nx/Lerna
- Zero-config para workspaces pnpm
- Cache distribuido, paralelización simple
- Sufficiente para modular monolith

### JWT con Refresh Rotation
- Access token corto (15m) + refresh token largo (7d) en Redis
- Rotación: cada refresh invalida el token anterior
- Detección de reuso como mecanismo anti-robo
