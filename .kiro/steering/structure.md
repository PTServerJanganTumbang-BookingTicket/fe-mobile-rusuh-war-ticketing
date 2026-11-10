---
inclusion: always
name: Project Structure
description: Clean Architecture feature-first folder layout
---

# Project Structure

```
src/
├── app/          # Expo Router screens and layouts
├── core/         # Shared cross-cutting concerns
│   ├── domain/       # Entities, value objects, core interfaces
│   ├── data/         # Repository implementations, API clients
│   └── presentation/ # Shared UI components, hooks, theme
└── features/     # Feature modules (one folder per bounded context)
    └── <feature>/
        ├── domain/       # Feature entities and use cases
        ├── data/         # Feature-specific data sources
        └── presentation/ # Feature screens and components
```

**Dependency rule:** domain → data → presentation (outer layers depend on inner)

See `AGENTS.md` § Clean Architecture Boundaries for full dependency rules.
