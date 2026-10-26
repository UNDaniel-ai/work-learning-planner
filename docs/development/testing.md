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

Playwright starts an isolated dev server on port 3100 with `DATABASE_URL=file:local.db`, `TEST_DATABASE_URL=file:local.e2e.db`, and `LEARNING_ASSETS_DIR=temp/e2e-learning-assets`. The suite runs serially so planning periods, learning sessions, and review aggregation share one deterministic test database without touching personal data or `learning/`.

`e2e/learning.spec.ts` seeds the pinned CS336 path only after the browser selects the test database. It verifies a failed evidence item, a bounded coach event, a knowledge card, active recall, planning review aggregation, export metadata, and horizontal overflow at desktop and 390-pixel mobile viewports. E2E Markdown assets are ignored by Git.

## External Services

The test suite does not require a live Vikunja instance. The provider contract and Vikunja adapter use test doubles and mocked fetch responses. A real Vikunja instance remains a separate manual acceptance item.

The learning coach tests do not call a model provider. They verify the local boundary decision and audit record only: coach guidance may be recorded, while direct solutions, TODO completion, assignment edits, command execution, and request fields containing assignment source are rejected or blocked before any provider integration.
