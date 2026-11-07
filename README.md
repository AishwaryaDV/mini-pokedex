# Mini Pokédex

A single-page Angular 21 application to browse Pokémon and build teams, using GraphQL.
Built with standalone components, Angular Signals, a hand-rolled RxJS store, and strict
handling of loading / empty / error / success states on every async view.

## Tech stack

- **Angular 21** (standalone, `OnPush`, signals-first, `inject()`)
- **RxJS 7** custom stores (no NgRx/Akita/NgXS)
- **ngx-echarts** for the animated stat radar chart
- **Vitest** for unit tests, **ESLint + Prettier**, **husky + commitlint** (Conventional Commits)
- **json-graphql-server** as the local mock (queries + mutations)

## Getting started

Requires **Node ≥ 20.19**.

```bash
npm install
```

Run the mock server and the app in two terminals:

```bash
# Terminal 1 — GraphQL mock (teams) on http://localhost:4000
npm run mock

# Terminal 2 — app on http://localhost:4200
npm start
```

| Command          | What it does                                               |
| ---------------- | ---------------------------------------------------------- |
| `npm start`      | Dev server (`ng serve`) on :4200                           |
| `npm run mock`   | Mock GraphQL server (`json-graphql-server db.js`) on :4000 |
| `npm run build`  | Production build                                           |
| `npm test`       | Unit tests (Vitest)                                        |
| `npm run lint`   | ESLint                                                     |
| `npm run format` | Prettier write                                             |

The Pokémon list/detail come from the public **PokéAPI GraphQL** endpoint
(`https://beta.pokeapi.co/graphql/v1beta`); teams are read/created/deleted against the
**local mock**. Endpoints live in `src/app/common/constants.ts`.

## Architecture

```
src/app/
├── common/      # shared UI (async-state, skeleton, toast, type-badge, chip, sidebar),
│                # services (cache, toast), constants, utils, design tokens + mixins
├── core/        # logger + the resilient GraphQL client
├── pokedex/     # Pokémon feature: api service, state (store + selectors), components
└── teams/       # Teams feature: api service, state (store), validators, components
```

**State management.** Each feature owns a `BehaviorSubject`-backed store and keeps derived
data in separate selector streams:

- `pokemon.store` holds the cached list plus all list criteria (search, type, sort, page).
  Search runs through the canonical `debounceTime(300) → distinctUntilChanged() → switchMap`
  pipeline. `pokemon.selectors` derives the filtered → sorted → paged views with
  `combineLatest`, `distinctUntilChanged`, and `shareReplay(1)`.
- `team.store` performs **optimistic** create and delete: the UI updates immediately, then
  reconciles with the server result or **rolls back and shows an error toast** on failure.

Stores expose Observables; components consume them via `toSignal()` and never leak (the
async pipe / finite HTTP subscriptions). Local UI state uses `signal()`, derived values use
`computed()` (e.g. a team's type distribution and total base stats), and an `effect()`
persists the selected team to `localStorage` via `CacheService`.

**The four UI states.** A single `<app-async-state>` wrapper (driven by an `AsyncState<T>`
model) guarantees loading (skeleton/spinner), empty, error (with **Retry**), and success are
handled on every async view — the table, the detail panel's abilities, and the team list.

**Resilience.** `GraphqlClientService` is a thin, typed client over `HttpClient`. Idempotent
reads **retry with backoff**; mutations never retry (to avoid duplicates). Every failure —
network, HTTP status, or GraphQL-envelope error — is mapped to a friendly message the stores
surface to the UI. PokéAPI's beta endpoint is occasionally unavailable (5xx/timeout); when
that happens the app shows the error state with Retry rather than breaking.

## Features

- **Pokédex table** — sprite, name, type badges, six stats + total; sortable by any column;
  client-side pagination (10/25/50); debounced name search + type filter; row opens a
  slide-in detail panel with abilities and a radar chart that animates between Pokémon.
- **Teams** — grid of team cards (members, type distribution, total base stats); reactive
  builder form with a required/3–30-char name, a **debounced async uniqueness validator**,
  and a typeahead Pokémon picker (removable chips, 1–6 members); create via the optimistic
  flow; select a team (persisted) or delete it.

## Bonuses

The brief suggests picking at most one bonus; we deliberately added several, each
isolated so it never compromises a required feature:

- **Skeleton shimmer + micro-animations** — shimmer loading rows, mutation toasts, and
  staggered team-card entry.
- **Type-highlight directive** (`[appTypeHighlight]`) — marks Pokédex rows strong/weak vs. a
  selected type using a type-effectiveness chart.
- **Virtual scroll** — a view-mode **toggle** (`@angular/cdk/scrolling`) that renders the full
  filtered list, kept _alongside_ the required pagination rather than replacing it.
- **Drag-and-drop** (`@angular/cdk/drag-drop`) — drag Pokémon from a palette into team slots,
  reorder within, or drag out to remove.

## Testing

Vitest, run with `npm test`:

- `team.store.spec` — optimistic create rollback, success reconciliation, delete restore
- `pokemon.selectors.spec` — filtering, sorting, type filter + count, pagination
- `team.validators.spec` — async unique-name validator + min/max team size

## What I'd improve with more time

- **Offline cache** of the Pokémon list (persist to `localStorage` / IndexedDB) so the
  Pokédex survives a PokéAPI outage instead of showing the error state.
- **Virtual scroll** for the full national dex, and/or server-side search for large sets.
- **More tests** — component/integration coverage for the picker and detail panel, plus
  end-to-end flows.
- **Accessibility polish** — focus-trap + `Esc` to close the detail panel, and fuller
  keyboard navigation for the table and autocomplete.
- **Trainer switching** — the mock has two trainers; the UI currently assumes one.

## Conventions

Conventional Commits enforced by commitlint + husky; lint-staged runs ESLint + Prettier on
commit. Components are standalone with `OnPush`; services and store/selector public methods
carry JSDoc.
