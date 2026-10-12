# Local Setup

## Requirements

- Node.js 22 or newer.
- pnpm 10.
- A local SQLite file for planner data.
- Vikunja is optional for the first run; without it, the app uses the memory task provider.

## Install

```bash
pnpm install
cp .env.example .env
```

For a local-only run, set the database URL in `.env`:

```bash
DATABASE_URL=file:local.db
TEST_DATABASE_URL=file:local.test.db
```

Add `VIKUNJA_BASE_URL` and `VIKUNJA_API_TOKEN` only when a Vikunja instance is available. Do not commit `.env`, tokens, or the local database.

`TEST_DATABASE_URL` is optional for local SQLite URLs. When it is omitted, the app derives a sibling test database such as `file:local.test.db` from `DATABASE_URL`.

## Run

```bash
pnpm dev --hostname 127.0.0.1 --port 3000
```

Open <http://127.0.0.1:3000/today>.

The Settings page can test the server-side Vikunja connection, switch between the personal and test planning databases, and download a JSON export of the active database. The export does not include environment variables or API tokens.

## Quality Checks

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm e2e
```

The unit and component test suite uses an in-memory task provider and temporary SQLite files. It does not require a live Vikunja instance.

Local e2e uses the installed Google Chrome channel to avoid downloading a second browser through a VPN. CI uses the Playwright-managed Chromium channel.
