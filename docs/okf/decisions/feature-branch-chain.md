---
type: ADR
title: Feature Branch Chain Strategy
description: Estrategia de entrega con Feature Branch Chain — PRs pequeños y revisables.
tags: [adr, git, workflow, pr]
timestamp: 2026-07-16T12:00:00-04:00
---

# ADR: Feature Branch Chain Strategy

## Context

Cada fase del proyecto implica cambios en múltiples capas (config, dominio, infraestructura, presentación). Un solo PR sería enorme y difícil de revisar.

## Decisión

Usar **Feature Branch Chain**: una rama base (`feature/phase-N`) con PRs secuenciales que se mergean en cadena.

### Estructura

```
main
└── feature/phase-0          (rama base de la fase)
    ├── PR 1 → pr/phase-0/01-root-config   (root + shared + CI)
    ├── PR 2 → pr/phase-0/02-domain         (domain + application)
    ├── PR 3 → pr/phase-0/03-infra          (infrastructure + module)
    └── PR 4 → pr/phase-0/04-presentation   (controllers + web + tests)
```

### Reglas

- Cada PR mergea a `feature/phase-N`, no a `main`
- Cada PR es revisable independientemente (~400 líneas)
- Al completar la fase, `feature/phase-N` se mergea a `main`
- Cada PR incluye tests y documentación

## Ventajas

- PRs pequeños (~400 líneas)
- Cada PR es desplegable individualmente
- Fácil revertir PRs específicos
- Paralelización de revisión
