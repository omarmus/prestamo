---
type: Reference
title: Technology Stack
description: Stack tecnológico completo con versiones y justificación.
tags: [stack, technology, decisions]
timestamp: 2026-07-16T12:00:00-04:00
---

# Technology Stack

## Backend

| Tecnología | Versión | Propósito |
|-----------|---------|-----------|
| NestJS | 11.1.x | Framework backend con DI nativa, decoradores, modular |
| Prisma | 7.8.x | ORM type-safe con migraciones y studio |
| Passport + JWT | 0.7.x / 11.x | Estrategia de autenticación JWT |
| @node-rs/argon2 | latest | Hashing de contraseñas (más rápido que bcrypt) |
| ioredis | 5.x | Cliente Redis para refresh tokens |
| Zod | 3.x | Validación en capa compartida |

## Frontend

| Tecnología | Versión | Propósito |
|-----------|---------|-----------|
| Next.js | 16.2.x | React framework con App Router |
| React | 19.2.x | UI library |
| Tailwind CSS | 4.1.x | Utility-first CSS |
| shadcn/ui | 4.x (base-nova) | Componentes accesibles sobre Radix UI — **único sistema de componentes** |
| Storybook | 10.5.x | Visual development environment para componentes |
| Boneyard | 1.9.x | Static copy de componentes para SEO (skeleton HTML) |
| tw-animate-css | 1.4.x | Animaciones CSS para shadcn/ui (fade, slide, zoom, accordion) |
| Lucide React | 1.x | Iconografía minimalista outline |
| CodeGraph | latest | Índice AST para navegación y análisis del código |

## Herramientas de Desarrollo

| Herramienta | Propósito |
|------------|-----------|
| Turborepo | Orquestación de builds monorepo con caching |
| pnpm | Package manager con workspaces |
| Jest | Testing (unit + integración) |
| CodeGraph | Búsqueda estructural sobre AST (no grep) |
| Ponytail | Modo lazy — simplificaciones deliberadas marcadas con `ponytail:` |

## Infraestructura

| Tecnología | Versión | Propósito |
|-----------|---------|-----------|
| PostgreSQL | 16-alpine | Base de datos principal |
| Redis | 7-alpine | Refresh tokens, caché |
| Docker Compose | 3.8 | Entorno local |
| GitHub Actions | — | CI/CD |

## Branding (Design Tokens)

| Token | Light | Dark |
|-------|-------|------|
| `--primary` | `#1D4ED8` | `#3B82F6` |
| `--secondary` | `#06B6D4` | `#06B6D4` |
| `--accent` | `#F97316` | `#F97316` |
| `--background` | `#F8FAFC` | `#020617` |
| `--foreground` | `#0F172A` | `#FFFFFF` |
| `--success` | `#22C55E` | `#22C55E` |
| `--warning` | `#FACC15` | `#FACC15` |
| `--error` | `#EF4444` | `#EF4444` |

- Border radius base: `0.75rem` (12px)
- Sistema de espaciado: 8px
- Tipografía: Geist (Inter como alternativa)
- Animaciones: 200ms, suaves
