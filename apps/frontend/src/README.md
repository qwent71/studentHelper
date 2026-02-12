# src/ — FSD Layers

```
app/        → Composition root: providers, global wiring
widgets/    → Autonomous UI blocks composed from features/entities
features/   → User-facing interactions and use cases
entities/   → Business domain models and their UI
shared/     → Infrastructure: API client, auth, env, types, config
```

**Dependency rule:** each layer may only import from layers below it.

```
app → widgets → features → entities → shared
```

Note: `pages/` layer is omitted because `src/pages/` conflicts with Next.js Pages Router detection. Next.js `app/` directory handles routing directly.
