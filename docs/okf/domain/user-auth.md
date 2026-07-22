---
type: Domain Model
title: User & Authentication Domain
description: Entidades, value objects y reglas de dominio para autenticación de usuarios.
tags: [domain, user, auth, ddd]
timestamp: 2026-07-16T12:00:00-04:00
---

# User & Authentication Domain

## User Entity

Entidad raíz del módulo Identity. Propiedades:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | `string` (UUID) | Identificador único |
| `email` | `Email` (VO) | Email validado |
| `passwordHash` | `string` | Hash argon2id |
| `name` | `string` | Nombre completo |
| `phone` | `Phone?` (VO) | Teléfono boliviano opcional |
| `isActive` | `boolean` | Estado de la cuenta |
| `createdAt` | `Date` | Fecha de registro |
| `updatedAt` | `Date` | Última modificación |

## Value Objects

- **Email**: validación con regex + normalización a minúsculas
- **Phone**: formato boliviano (`+591XXXXXXXX`) con validación de longitud y prefijo

## Reglas de Dominio

- Email debe ser único en el sistema
- Password debe tener mínimo 8 caracteres (validación en capa compartida)
- Refresh token rotation: al refrescar, el token anterior se invalida. Si se reusa un token ya invalidado, todos los refresh tokens del usuario se invalidan (detección de robo)
- **CI obligatorio**: al registrarse, el cliente debe proporcionar su número de cédula de identidad (`documentNumber`). Se almacena en el Customer asociado al User. `documentType` por defecto es `"CI"`.

## Errores de Dominio

| Error | Causa |
|-------|-------|
| `InvalidCredentialsError` | Email o password incorrectos |
| `UserAlreadyExistsError` | Email ya registrado |
| `InvalidTokenError` | Token inválido o expirado |
| `TokenReuseError` | Refresh token reusado (posible robo) |
