import { asc, eq } from "drizzle-orm";
import type {
  Area,
  EntityId,
  Goal,
  LearningTopic,
  PlanningPeriod,
  Review,
  TaskLink,
  TaskProviderName,
  TimeBlock
} from "../../domain/planning/types";
import type { PlannerDatabase } from "./client";
import {
  areas,
  goals,
  learningTopics,
  planningPeriodFocusGoals,
  planningPeriodTaskLinks,
  planningPeriods,
  reviews,
  syncCursors,
  taskLinks,
  timeBlocks
} from "./schema";

export type SyncCursorStatus = "ok" | "failed";

export type SyncCursor = {
  provider: TaskProviderName;
  cursor: string;
  lastSyncedAt: string;
  status: SyncCursorStatus;
  error?: string;
};

export type PlanningDataExport = {
  areas: Area[];
  goals: Goal[];
  learningTopics: LearningTopic[];
  planningPeriods: PlanningPeriod[];
  timeBlocks: TimeBlock[];
  reviews: Review[];
  taskLinks: TaskLink[];
  syncCursors: SyncCursor[];
};

export function createPlanningRepository(db: PlannerDatabase) {
  return {
    async createArea(area: Area): Promise<void> {
      await db.insert(areas).values(normalizeOptional(area));
    },

    async listAreas(): Promise<Area[]> {
      const rows = await db
        .select()
        .from(areas)
        .orderBy(asc(areas.kind), asc(areas.id));

      return rows.map((row) => normalizeUndefined(row) as Area);
    },

    async createGoal(goal: Goal): Promise<void> {
      await db.insert(goals).values(goal);
    },

    async listGoals(): Promise<Goal[]> {
      return db.select().from(goals).orderBy(asc(goals.createdAt), asc(goals.id));
    },

    async createLearningTopic(topic: LearningTopic): Promise<void> {
      await db.insert(learningTopics).values(topic);
    },

    async listLearningTopics(): Promise<LearningTopic[]> {
      return db
        .select()
        .from(learningTopics)
        .orderBy(asc(learningTopics.createdAt), asc(learningTopics.id));
    },

    async createTaskLink(taskLink: TaskLink): Promise<void> {
      await db.insert(taskLinks).values(normalizeOptional(taskLink));
    },

    async listTaskLinks(): Promise<TaskLink[]> {
      const rows = await db.select().from(taskLinks).orderBy(asc(taskLinks.id));

      return rows.map((row) => normalizeUndefined(row) as TaskLink);
    },

    async createPlanningPeriod(period: PlanningPeriod): Promise<void> {
      await db.insert(planningPeriods).values({
        id: period.id,
        type: period.type,
        startsOn: period.startsOn,
        endsOn: period.endsOn
      });

      if (period.focusGoalIds.length > 0) {
        await db.insert(planningPeriodFocusGoals).values(
          period.focusGoalIds.map((goalId) => ({
            periodId: period.id,
            goalId
          }))
        );
      }

      if (period.taskLinkIds.length > 0) {
        await db.insert(planningPeriodTaskLinks).values(
          period.taskLinkIds.map((taskLinkId) => ({
            periodId: period.id,
            taskLinkId
          }))
        );
      }
    },

    async getPlanningPeriod(
      periodId: EntityId
    ): Promise<PlanningPeriod | undefined> {
      return getPlanningPeriod(db, periodId);
    },

    async listPlanningPeriods(): Promise<PlanningPeriod[]> {
      const rows = await db
        .select()
        .from(planningPeriods)
        .orderBy(asc(planningPeriods.startsOn), asc(planningPeriods.id));

      return Promise.all(rows.map((row) => hydratePlanningPeriod(db, row)));
    },

    async createTimeBlock(timeBlock: TimeBlock): Promise<void> {
      await db.insert(timeBlocks).values(normalizeOptional(timeBlock));
    },

    async listTimeBlocksForPeriod(periodId: EntityId): Promise<TimeBlock[]> {
      const rows = await db
        .select()
        .from(timeBlocks)
        .where(eq(timeBlocks.periodId, periodId))
        .orderBy(asc(timeBlocks.startsAt), asc(timeBlocks.id));

      return rows.map((row) => normalizeUndefined(row) as TimeBlock);
    },

    async getTimeBlock(timeBlockId: EntityId): Promise<TimeBlock | undefined> {
      const [row] = await db
        .select()
        .from(timeBlocks)
        .where(eq(timeBlocks.id, timeBlockId))
        .limit(1);

      return row ? (normalizeUndefined(row) as TimeBlock) : undefined;
    },

    async updateTimeBlock(timeBlock: TimeBlock): Promise<void> {
      await db
        .update(timeBlocks)
        .set({
          periodId: timeBlock.periodId,
          areaId: timeBlock.areaId,
          startsAt: timeBlock.startsAt,
          endsAt: timeBlock.endsAt,
          durationMinutes: timeBlock.durationMinutes,
          taskLinkId: timeBlock.taskLinkId ?? null,
          actualMinutes: timeBlock.actualMinutes ?? null,
          note: timeBlock.note ?? null
        })
        .where(eq(timeBlocks.id, timeBlock.id));
    },

    async listTimeBlocks(): Promise<TimeBlock[]> {
      const rows = await db
        .select()
        .from(timeBlocks)
        .orderBy(asc(timeBlocks.startsAt), asc(timeBlocks.id));

      return rows.map((row) => normalizeUndefined(row) as TimeBlock);
    },

    async createReview(review: Review): Promise<void> {
      await db.insert(reviews).values(review);
    },

    async listReviewsForPeriod(periodId: EntityId): Promise<Review[]> {
      return db
        .select()
        .from(reviews)
        .where(eq(reviews.periodId, periodId))
        .orderBy(asc(reviews.createdAt), asc(reviews.id));
    },

    async listReviews(): Promise<Review[]> {
      return db
        .select()
        .from(reviews)
        .orderBy(asc(reviews.createdAt), asc(reviews.id));
    },

    async upsertSyncCursor(syncCursor: SyncCursor): Promise<void> {
      await db
        .insert(syncCursors)
        .values(normalizeOptional(syncCursor))
        .onConflictDoUpdate({
          target: syncCursors.provider,
          set: normalizeOptional(syncCursor)
        });
    },

    async getSyncCursor(
      provider: TaskProviderName
    ): Promise<SyncCursor | undefined> {
      const [row] = await db
        .select()
        .from(syncCursors)
        .where(eq(syncCursors.provider, provider))
        .limit(1);

      return row ? toSyncCursor(row) : undefined;
    },

    async listSyncCursors(): Promise<SyncCursor[]> {
      const rows = await db
        .select()
        .from(syncCursors)
        .orderBy(asc(syncCursors.provider));

      return rows.map(toSyncCursor);
    },

    async exportPlanningData(): Promise<PlanningDataExport> {
      const [
        areaRows,
        goalRows,
        learningTopicRows,
        planningPeriodRows,
        timeBlockRows,
        reviewRows,
        taskLinkRows,
        syncCursorRows
      ] = await Promise.all([
        this.listAreas(),
        this.listGoals(),
        this.listLearningTopics(),
        this.listPlanningPeriods(),
        this.listTimeBlocks(),
        this.listReviews(),
        this.listTaskLinks(),
        this.listSyncCursors()
      ]);

      return {
        areas: areaRows,
        goals: goalRows,
        learningTopics: learningTopicRows,
        planningPeriods: planningPeriodRows,
        timeBlocks: timeBlockRows,
        reviews: reviewRows,
        taskLinks: taskLinkRows,
        syncCursors: syncCursorRows
      };
    }
  };
}

export type PlanningRepository = ReturnType<typeof createPlanningRepository>;

async function getPlanningPeriod(
  db: PlannerDatabase,
  periodId: EntityId
): Promise<PlanningPeriod | undefined> {
  const [row] = await db
    .select()
    .from(planningPeriods)
    .where(eq(planningPeriods.id, periodId))
    .limit(1);

  if (!row) {
    return undefined;
  }

  return hydratePlanningPeriod(db, row);
}

async function hydratePlanningPeriod(
  db: PlannerDatabase,
  row: typeof planningPeriods.$inferSelect
): Promise<PlanningPeriod> {
  const [focusRows, taskLinkRows] = await Promise.all([
    db
      .select({ goalId: planningPeriodFocusGoals.goalId })
      .from(planningPeriodFocusGoals)
      .where(eq(planningPeriodFocusGoals.periodId, row.id))
      .orderBy(asc(planningPeriodFocusGoals.goalId)),
    db
      .select({ taskLinkId: planningPeriodTaskLinks.taskLinkId })
      .from(planningPeriodTaskLinks)
      .where(eq(planningPeriodTaskLinks.periodId, row.id))
      .orderBy(asc(planningPeriodTaskLinks.taskLinkId))
  ]);

  return {
    id: row.id,
    type: row.type,
    startsOn: row.startsOn,
    endsOn: row.endsOn,
    focusGoalIds: focusRows.map((focusRow) => focusRow.goalId),
    taskLinkIds: taskLinkRows.map((taskLinkRow) => taskLinkRow.taskLinkId)
  };
}

function normalizeOptional<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).map(([key, entryValue]) => [
      key,
      entryValue === undefined ? null : entryValue
    ])
  ) as T;
}

function normalizeUndefined<T extends Record<string, unknown>>(
  value: T | undefined
): T | undefined {
  if (!value) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, entryValue]) => [
      key,
      entryValue === null ? undefined : entryValue
    ])
  ) as T;
}

function toSyncCursor(row: typeof syncCursors.$inferSelect): SyncCursor {
  return normalizeUndefined(row) as SyncCursor;
}
