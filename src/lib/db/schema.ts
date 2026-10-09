import {
  integer,
  primaryKey,
  sqliteTable,
  text
} from "drizzle-orm/sqlite-core";

const areaKinds = ["work", "learning"] as const;
const entityStatuses = ["active", "completed", "archived"] as const;
const goalHorizons = ["quarter", "month", "week"] as const;
const planningPeriodTypes = ["week", "day"] as const;
const reviewTypes = ["daily", "weekly"] as const;
const taskProviders = ["vikunja"] as const;
const syncStatuses = ["ok", "failed"] as const;

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
