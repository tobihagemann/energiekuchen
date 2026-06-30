# app/lib — Business Logic

## Test placement

Co-locate unit tests in a `__tests__/` folder beside the source, named `<name>.test.ts`:

- `utils/shade.ts` → `utils/__tests__/shade.test.ts`
- `hooks/useChartData.ts` → `hooks/__tests__/useChartData.test.ts`
- `contexts/EnergyContext.tsx` → `contexts/__tests__/EnergyContext.test.tsx`

## Gotchas

- **Pointer-hook tests:** jsdom has no `PointerEvent` constructor. Build events with `new Event(type)` + `Object.assign(event, props)`, not `new PointerEvent(...)`.
- **State-updater purity:** never put `.focus()` or other side effects inside a `setState(prev => ...)` updater — Strict Mode runs it twice in dev. Do side effects in an effect or event handler.
- **knip:** export only what's consumed _outside the defining file_. Test-only references count as "used", so `pnpm knip` will **not** flag exports that only tests touch — remove that dead code yourself.
- **Load/save validation symmetry:** validators on the load path must match the write path, or autosave + reload silently erases user data. Change them together.
- **Discriminated unions:** pass an explicit generic to `useState` for union fields (e.g. polarity) — initial-value inference widens to `string`.
- **Id-keyed maps over activity ids:** activity ids are user-controlled (import/share preserves them via `ensureActivityId`). Build id-keyed lookups with `Object.create(null)` or a `Map` — a `"__proto__"` id is silently swallowed by a plain object's prototype setter, so the read returns `Object.prototype` instead of the stored value.
- **Context unit tests assert exact state:** `contexts/__tests__/UIContext.test.tsx` checks the whole state object via `toEqual({...})` (initial state, `CLOSE_ALL_MODALS`, etc.). Adding a `UIState` field (e.g. a new modal flag) without updating those assertions fails `pnpm test` even when the implementation is correct — change them together.
- **Utils coverage gate:** `jest.config.ts` enforces 95% line / 90% branch coverage per file under `app/lib/utils/**`. Code that touches browser-only APIs (canvas, `Image`, `navigator.share`, `XMLSerializer`) can't be exercised in jsdom, so a util mixing pure logic with such glue fails the gate. Split it: keep the pure, unit-tested logic in one module and put the DOM/browser glue in a separate module excluded from `collectCoverageFrom` (alongside `cn.ts`), covered by E2E instead.
