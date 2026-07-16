---
type: Module
title: Identity Module
description: Módulo de autenticación y gestión de usuarios — register, login, refresh token rotation, JWT guard.
tags: [module, auth, identity, users]
timestamp: 2026-07-16T12:00:00-04:00
---

# Identity Module

## Capacidades

- **Register** — crear usuario con email + password (argon2id hashing)
- **Login** — autenticar credenciales, emitir access token (JWT 15m) + refresh token (7d)
- **Refresh** — rotación de refresh tokens con detección de reuso (token rotation)
- **Me** — obtener perfil del usuario autenticado

## Puertos (Application Layer)

| Puerto | Implementación |
|--------|---------------|
| `PasswordHasher` | `PasswordHasherService` (argon2id) |
| `JwtService` | `JwtServiceImpl` (JWT HS256) |
| `RefreshTokenService` | `RefreshTokenServiceImpl` (Redis) |
| `UserRepository` | `PrismaUserRepository` |

## Endpoints

| Método | Ruta | Body | Auth |
|--------|------|------|------|
| POST | `/auth/register` | `{email, password, name, phone?}` | No |
| POST | `/auth/login` | `{email, password}` | No |
| POST | `/auth/refresh` | `{refreshToken}` | No |
| GET | `/auth/me` | — | JWT required |

## Flujo de Refresh Token

```
Request Refresh → Validar token en Redis → 
  → Rotar: nuevo access + refresh → 
  → Detección de reuso: si el token ya fue usado, invalidar TODOS los tokens del usuario
```
