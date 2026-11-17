> **STATUS: HISTORICAL / TRANSITIONAL AI SESSION MEMORY (FROZEN 2026-11-13) — NOT CANONICAL.**
> Do not use this file as current ticket/PR/status authority or canonical architecture/contract truth.
> Canonical truth lives in `AGENTS.md`, executable source/config/tests, `docs/ARCHITECTURE.md`, `docs/CONTRACT-BASELINE.md`, `docs/KNOWN-ISSUES.md`, and Git / GitHub.

---

# System Patterns — fe-mobile-rusuh-war-ticketing

## Clean Architecture (feature-first)

```
src/
├── app/              # Expo Router (file-based routing ONLY)
├── core/{domain,data,presentation}
└── features/<feature>/{domain,data,presentation} + index.ts (public API)
```

- domain: pure TypeScript (+ core/domain) — no React/RN/external libs.
- data: domain + core/domain + external libs — no React.
- presentation: domain, data, React/RN.
- Cross-feature imports only via `features/<x>/index.ts`.
- `app/` routes use feature public APIs and `core/*` only.

Enforced by eslint-plugin-boundaries + `npm run boundary-check` (CI gate).

## Signal UI integration (GH-3 pattern)

- Consumed as **sibling source** via Metro custom resolver (origin-aware):
  bare imports from `signal-ui-react-shared` re-resolved from fe-mobile origin.
- `disableHierarchicalLookup=true` was rejected (broke Reanimated semver resolution).
- Nativewind `cssInterop` can drop function-valued Pressable styles — keep visual
  styles on an inner View, static minWidth/minHeight on Pressable (GH-3 fix).

## Auth data pattern (GH-6)

- Access token: memory-only. Refresh token: `expo-secure-store` only.
- No AsyncStorage fallback; no automatic retry. Deep-link scheme deferred to GH-7.

## Queue pattern (GH-8/GH-9)

- `FakeQueueDataSource` (deterministic, GH-8) vs `RealQueueDataSource` (HTTP+SSE, GH-9),
  selected via data source factory.
- SSE parser + error mapper in data layer; FULL_QUEUE/FULL_BOOKED distinct domain states.
- Queue error domain types (T1), HTTP DTOs, error mapper, SSE parser, HTTP client,
  SSE client, RealQueueDataSource, factory, local integration tests.

## Spec workflow

`.kiro/specs/GH-<n>-<slug>/{requirements,design,tasks}.md` — R-IDs, ACs, ADRs,
correctness properties, one task = one commit. Format per `.clinerules/spec-format.md`.
