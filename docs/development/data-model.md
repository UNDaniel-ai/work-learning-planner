# Data Model

This app keeps personal planning and learning indexes in local SQLite, stores
user-authored learning assets as Git-tracked Markdown, and keeps task execution
details in Vikunja.

## Tables

- `areas`: work or learning spaces. Optional `color` supports UI grouping.
- `goals`: quarter, month, or week goals attached to an area.
- `learning_topics`: learning tracks attached to an area, with `progress_percent` from 0 to 100.
- `learning_sources`: external source metadata, revision, license, and the AI guidance boundary. External source content is not copied locally.
- `learning_tracks`: a learning objective linked to one source and optionally to an existing `learning_topic`.
- `learning_modules`: ordered units within a track, including expected outcomes and JSON acceptance criteria.
- `study_sessions`: one-question learning activities. A session can optionally link to a planning period, time block, and Vikunja task link.
- `evidence_items`: test, experiment, error, commit, quotation locator, or manual-summary evidence attached to a study session.
- `knowledge_cards`: evidence-backed learning indexes with maturity, confidence, source/evidence IDs, related card IDs, and a Markdown path. The Markdown body remains outside SQLite.
- `review_items`: active-recall prompts and their next-review state, ordered through the `status` and `next_review_at` queue index.
- `ai_coach_events`: summaries of allowed or blocked coaching interactions. Full conversations and assignment source code are not stored.
- `task_links`: local references to external Vikunja tasks. Only provider, external ID, and an optional title snapshot are stored.
- `planning_periods`: week or day planning windows with date-only `starts_on` and `ends_on`.
- `planning_period_focus_goals`: many-to-many relation between planning periods and focus goals.
- `planning_period_task_links`: many-to-many relation between planning periods and selected external tasks.
- `time_blocks`: planned or actual time blocks inside a planning period.
- `reviews`: daily or weekly structured review records.
- `sync_cursors`: provider sync state, used by future Vikunja polling.

## Boundaries

- SQLite owns local planning structure and learning state: areas, goals, learning topics, sources, tracks, modules, sessions, evidence indexes, card indexes, review scheduling, AI boundary events, planning periods, time blocks, reviews, task links, and sync cursors.
- Git-tracked Markdown under `learning/` owns user-authored track notes, session notes, experiment notes, and knowledge-card bodies. Stable IDs live in frontmatter; file names are not identities.
- Vikunja owns executable task details: full task body, project hierarchy, labels, reminders, repeat rules, attachments, and collaboration metadata.
- Local task links intentionally store only the external task ID and a small title snapshot, so exports do not copy API tokens or full external task content into local planning data.
- Source records retain URLs, revision identifiers, and user summaries only. Course text, repositories, datasets, model weights, and complete assignment solutions remain outside this database and export boundary.
- The CS336 seed endpoint is test-mode only. It creates the pinned `coach_only` source and eight ordered modules in the test database; its Markdown files follow the configured E2E asset root rather than `learning/`.

## Migration Source

The Drizzle schema lives in `src/lib/db/schema.ts`. Generated SQL migrations live under `drizzle/` and are tracked by Git.
