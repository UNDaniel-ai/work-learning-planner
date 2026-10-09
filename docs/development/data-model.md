# Data Model

This app keeps personal planning semantics in local SQLite and keeps task execution details in Vikunja.

## Tables

- `areas`: work or learning spaces. Optional `color` supports UI grouping.
- `goals`: quarter, month, or week goals attached to an area.
- `learning_topics`: learning tracks attached to an area, with `progress_percent` from 0 to 100.
- `task_links`: local references to external Vikunja tasks. Only provider, external ID, and an optional title snapshot are stored.
- `planning_periods`: week or day planning windows with date-only `starts_on` and `ends_on`.
- `planning_period_focus_goals`: many-to-many relation between planning periods and focus goals.
- `planning_period_task_links`: many-to-many relation between planning periods and selected external tasks.
- `time_blocks`: planned or actual time blocks inside a planning period.
- `reviews`: daily or weekly structured review records.
- `sync_cursors`: provider sync state, used by future Vikunja polling.

## Boundaries

- SQLite owns local planning structure: areas, goals, learning topics, planning periods, time blocks, reviews, task links, and sync cursors.
- Vikunja owns executable task details: full task body, project hierarchy, labels, reminders, repeat rules, attachments, and collaboration metadata.
- Local task links intentionally store only the external task ID and a small title snapshot, so exports do not copy API tokens or full external task content into local planning data.

## Migration Source

The Drizzle schema lives in `src/lib/db/schema.ts`. Generated SQL migrations live under `drizzle/` and are tracked by Git.
