import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex
} from "drizzle-orm/sqlite-core";

const areaKinds = ["work", "learning"] as const;
const entityStatuses = ["active", "completed", "archived"] as const;
const goalHorizons = ["quarter", "month", "week"] as const;
const planningPeriodTypes = ["week", "day"] as const;
const reviewTypes = ["daily", "weekly"] as const;
const taskProviders = ["vikunja"] as const;
const syncStatuses = ["ok", "failed"] as const;
const learningSourceKinds = [
  "course",
  "paper",
  "book",
  "repo",
  "article",
  "video",
  "project"
] as const;
const learningSourceStatuses = ["active", "archived"] as const;
const aiGuidanceModes = ["open", "coach_only", "restricted"] as const;
const learningModuleStatuses = [
  "not_started",
  "active",
  "blocked",
  "completed"
] as const;
const studySessionStatuses = [
  "planned",
  "active",
  "completed",
  "blocked"
] as const;
const evidenceKinds = [
  "test",
  "error",
  "toy_example",
  "shape_check",
  "performance",
  "commit",
  "source_quote",
  "manual_summary"
] as const;
const evidenceResults = ["pass", "fail", "observed", "unknown"] as const;
const knowledgeMaturities = [
  "observed",
  "understood",
  "verified",
  "applied",
  "teachable"
] as const;
const reviewItemStatuses = ["active", "suspended", "mastered"] as const;
const aiCoachModes = [
  "socratic",
  "concept_hint",
  "debug_guide",
  "code_review",
  "synthesis",
  "recall_quiz",
  "direct_solution"
] as const;
const aiCoachBoundaries = ["allowed", "blocked"] as const;

export const areas = sqliteTable("areas", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  kind: text("kind", { enum: areaKinds }).notNull(),
  color: text("color")
});

export const goals = sqliteTable("goals", {
  id: text("id").primaryKey(),
  areaId: text("area_id")
    .notNull()
    .references(() => areas.id),
  title: text("title").notNull(),
  horizon: text("horizon", { enum: goalHorizons }).notNull(),
  status: text("status", { enum: entityStatuses }).notNull(),
  createdAt: text("created_at").notNull()
});

export const learningTopics = sqliteTable("learning_topics", {
  id: text("id").primaryKey(),
  areaId: text("area_id")
    .notNull()
    .references(() => areas.id),
  title: text("title").notNull(),
  progressPercent: integer("progress_percent").notNull(),
  status: text("status", { enum: entityStatuses }).notNull(),
  createdAt: text("created_at").notNull()
});

export const learningSources = sqliteTable("learning_sources", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  kind: text("kind", { enum: learningSourceKinds }).notNull(),
  url: text("url").notNull(),
  repositoryUrl: text("repository_url"),
  revision: text("revision"),
  license: text("license"),
  aiGuidance: text("ai_guidance", { enum: aiGuidanceModes }).notNull(),
  summary: text("summary"),
  status: text("status", { enum: learningSourceStatuses }).notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull()
});

export const learningTracks = sqliteTable(
  "learning_tracks",
  {
    id: text("id").primaryKey(),
    learningTopicId: text("learning_topic_id").references(
      () => learningTopics.id
    ),
    sourceId: text("source_id")
      .notNull()
      .references(() => learningSources.id),
    title: text("title").notNull(),
    objective: text("objective").notNull(),
    status: text("status", { enum: entityStatuses }).notNull(),
    markdownPath: text("markdown_path"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull()
  },
  (table) => [
    index("learning_tracks_source_idx").on(table.sourceId),
    index("learning_tracks_topic_idx").on(table.learningTopicId)
  ]
);

export const learningModules = sqliteTable(
  "learning_modules",
  {
    id: text("id").primaryKey(),
    trackId: text("track_id")
      .notNull()
      .references(() => learningTracks.id),
    title: text("title").notNull(),
    sequence: integer("sequence").notNull(),
    status: text("status", { enum: learningModuleStatuses }).notNull(),
    expectedOutcome: text("expected_outcome").notNull(),
    acceptanceCriteria: text("acceptance_criteria", { mode: "json" })
      .$type<string[]>()
      .notNull(),
    markdownPath: text("markdown_path"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull()
  },
  (table) => [
    uniqueIndex("learning_modules_track_sequence_unique").on(
      table.trackId,
      table.sequence
    )
  ]
);

export const knowledgeCards = sqliteTable(
  "knowledge_cards",
  {
    id: text("id").primaryKey(),
    trackId: text("track_id")
      .notNull()
      .references(() => learningTracks.id),
    moduleId: text("module_id")
      .notNull()
      .references(() => learningModules.id),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    sourceIds: text("source_ids", { mode: "json" })
      .$type<string[]>()
      .notNull(),
    evidenceIds: text("evidence_ids", { mode: "json" })
      .$type<string[]>()
      .notNull(),
    relatedCardIds: text("related_card_ids", { mode: "json" })
      .$type<string[]>()
      .notNull(),
    maturity: text("maturity", { enum: knowledgeMaturities }).notNull(),
    confidence: integer("confidence").notNull(),
    summary: text("summary").notNull(),
    markdownPath: text("markdown_path"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull()
  },
  (table) => [
    uniqueIndex("knowledge_cards_track_slug_unique").on(
      table.trackId,
      table.slug
    ),
    index("knowledge_cards_module_idx").on(table.moduleId)
  ]
);

export const taskLinks = sqliteTable("task_links", {
  id: text("id").primaryKey(),
  provider: text("provider", { enum: taskProviders }).notNull(),
  externalTaskId: text("external_task_id").notNull(),
  titleSnapshot: text("title_snapshot")
});

export const planningPeriods = sqliteTable("planning_periods", {
  id: text("id").primaryKey(),
  type: text("type", { enum: planningPeriodTypes }).notNull(),
  startsOn: text("starts_on").notNull(),
  endsOn: text("ends_on").notNull()
});

export const planningPeriodFocusGoals = sqliteTable(
  "planning_period_focus_goals",
  {
    periodId: text("period_id")
      .notNull()
      .references(() => planningPeriods.id),
    goalId: text("goal_id")
      .notNull()
      .references(() => goals.id)
  },
  (table) => [primaryKey({ columns: [table.periodId, table.goalId] })]
);

export const planningPeriodTaskLinks = sqliteTable(
  "planning_period_task_links",
  {
    periodId: text("period_id")
      .notNull()
      .references(() => planningPeriods.id),
    taskLinkId: text("task_link_id")
      .notNull()
      .references(() => taskLinks.id)
  },
  (table) => [primaryKey({ columns: [table.periodId, table.taskLinkId] })]
);

export const timeBlocks = sqliteTable("time_blocks", {
  id: text("id").primaryKey(),
  periodId: text("period_id")
    .notNull()
    .references(() => planningPeriods.id),
  areaId: text("area_id")
    .notNull()
    .references(() => areas.id),
  startsAt: text("starts_at").notNull(),
  endsAt: text("ends_at").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  taskLinkId: text("task_link_id").references(() => taskLinks.id),
  actualMinutes: integer("actual_minutes"),
  note: text("note")
});

export const studySessions = sqliteTable(
  "study_sessions",
  {
    id: text("id").primaryKey(),
    moduleId: text("module_id")
      .notNull()
      .references(() => learningModules.id),
    planningPeriodId: text("planning_period_id").references(
      () => planningPeriods.id
    ),
    timeBlockId: text("time_block_id").references(() => timeBlocks.id),
    taskLinkId: text("task_link_id").references(() => taskLinks.id),
    startedAt: text("started_at"),
    endedAt: text("ended_at"),
    status: text("status", { enum: studySessionStatuses }).notNull(),
    question: text("question").notNull(),
    preUnderstanding: text("pre_understanding").notNull(),
    attemptSummary: text("attempt_summary"),
    blocker: text("blocker"),
    outcome: text("outcome"),
    markdownPath: text("markdown_path"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull()
  },
  (table) => [
    index("study_sessions_module_created_idx").on(
      table.moduleId,
      table.createdAt
    ),
    index("study_sessions_period_idx").on(table.planningPeriodId),
    index("study_sessions_time_block_idx").on(table.timeBlockId),
    index("study_sessions_task_link_idx").on(table.taskLinkId)
  ]
);

export const evidenceItems = sqliteTable(
  "evidence_items",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id")
      .notNull()
      .references(() => studySessions.id),
    kind: text("kind", { enum: evidenceKinds }).notNull(),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    reference: text("reference").notNull(),
    result: text("result", { enum: evidenceResults }).notNull(),
    markdownPath: text("markdown_path"),
    createdAt: text("created_at").notNull()
  },
  (table) => [
    index("evidence_items_session_created_idx").on(
      table.sessionId,
      table.createdAt
    )
  ]
);

export const reviewItems = sqliteTable(
  "review_items",
  {
    id: text("id").primaryKey(),
    knowledgeCardId: text("knowledge_card_id")
      .notNull()
      .references(() => knowledgeCards.id),
    prompt: text("prompt").notNull(),
    answerHint: text("answer_hint"),
    lastAnswer: text("last_answer"),
    lastErrorType: text("last_error_type"),
    lastReviewedAt: text("last_reviewed_at"),
    nextReviewAt: text("next_review_at").notNull(),
    ease: integer("ease").notNull(),
    reviewCount: integer("review_count").notNull(),
    lapseCount: integer("lapse_count").notNull(),
    status: text("status", { enum: reviewItemStatuses }).notNull()
  },
  (table) => [
    index("review_items_queue_idx").on(table.status, table.nextReviewAt),
    index("review_items_card_idx").on(table.knowledgeCardId)
  ]
);

export const aiCoachEvents = sqliteTable(
  "ai_coach_events",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id")
      .notNull()
      .references(() => studySessions.id),
    mode: text("mode", { enum: aiCoachModes }).notNull(),
    inputSummary: text("input_summary").notNull(),
    outputSummary: text("output_summary").notNull(),
    boundary: text("boundary", { enum: aiCoachBoundaries }).notNull(),
    createdAt: text("created_at").notNull()
  },
  (table) => [
    index("ai_coach_events_session_created_idx").on(
      table.sessionId,
      table.createdAt
    )
  ]
);

export const reviews = sqliteTable("reviews", {
  id: text("id").primaryKey(),
  periodId: text("period_id")
    .notNull()
    .references(() => planningPeriods.id),
  type: text("type", { enum: reviewTypes }).notNull(),
  wins: text("wins", { mode: "json" }).$type<string[]>().notNull(),
  misses: text("misses", { mode: "json" }).$type<string[]>().notNull(),
  adjustments: text("adjustments", { mode: "json" })
    .$type<string[]>()
    .notNull(),
  plannedMinutes: integer("planned_minutes").notNull(),
  actualMinutes: integer("actual_minutes").notNull(),
  varianceMinutes: integer("variance_minutes").notNull(),
  createdAt: text("created_at").notNull()
});

export const syncCursors = sqliteTable("sync_cursors", {
  provider: text("provider", { enum: taskProviders }).primaryKey(),
  cursor: text("cursor").notNull(),
  lastSyncedAt: text("last_synced_at").notNull(),
  status: text("status", { enum: syncStatuses }).notNull(),
  error: text("error")
});
