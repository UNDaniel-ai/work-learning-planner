# Testing Strategy

## Test Layers

- Domain tests cover planning rules, period reuse, time blocks, reviews, and provider error boundaries.
- Repository tests use temporary SQLite files and verify persistence plus export snapshots.
- API tests call route handlers directly with mocked runtime boundaries.
- Component tests use Testing Library and stub `fetch` at the browser/server boundary.
- `e2e/mvp.spec.ts` covers the main browser path: goals and learning, weekly planning, Today execution, Review, and JSON export.
- The e2e path switches Settings to the test database before creating data, so regression runs do not write to the personal planning database.

## TDD Loop

Product behavior follows:

```text
Verify RED -> Minimal Implementation -> Verify GREEN -> Refactor
```

Each implementation step records its target command and result in the session progress document under `temp/sessions/`.

## Commands

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm e2e
```

The local e2e configuration uses the installed Google Chrome channel. In CI, `PLAYWRIGHT` uses its managed Chromium channel through `CI=true`.

Playwright starts the dev server with `DATABASE_URL=file:local.db` and `TEST_DATABASE_URL=file:local.e2e.db` when it owns the server. If an existing local server is reused, the app can still derive `file:local.test.db` from `DATABASE_URL`.

## External Services

The test suite does not require a live Vikunja instance. The provider contract and Vikunja adapter use test doubles and mocked fetch responses. A real Vikunja instance remains a separate manual acceptance item.
