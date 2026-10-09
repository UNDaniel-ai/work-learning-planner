import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  createGoal,
  createLearningTopic,
  createReview,
  createTimeBlock,
  createWeeklyPlanningPeriod
} from "../../domain/planning/rules";
import type { Area, TaskLink } from "../../domain/planning/types";
import {
  createPlannerDatabase,
  migratePlannerDatabase,
  type PlannerDatabaseConnection
} from "./client";
import { createPlanningRepository } from "./repositories";

type TestDatabase = {
  connection: PlannerDatabaseConnection;
  path: string;
};

const testDatabases: TestDatabase[] = [];

afterEach(async () => {
  for (const testDatabase of testDatabases.splice(0)) {
    testDatabase.connection.close();
    await rm(testDatabase.path, { force: true });
  }
});

describe("planning repository", () => {
  it("persists planning records and returns an export snapshot", async () => {
    const repository = await createTestRepository();
    const workArea: Area = {
      id: "area-work",
      name: "Work",
      kind: "work",
      color: "#2f6fed"
    };
    const learningArea: Area = {
      id: "area-learning",
      name: "Learning",
      kind: "learning"
    };
    const goal = createGoal({
      id: "goal-1",
      areaId: workArea.id,
      title: "Ship planner MVP",
      horizon: "quarter",
      createdAt: "2026-10-09T00:00:00.000Z"
    });
    const topic = createLearningTopic({
      id: "topic-1",
      areaId: learningArea.id,
      title: "TypeScript testing",
      progressPercent: 35,
      createdAt: "2026-10-09T00:00:00.000Z"
    });
    const taskLink: TaskLink = {
      id: "task-link-1",
      provider: "vikunja",
      externalTaskId: "vikunja-task-42",
      titleSnapshot: "Draft weekly plan"
    };
    const period = createWeeklyPlanningPeriod({
      id: "period-1",
      anchorDate: "2026-10-09",
      focusGoalIds: [goal.id],
      taskLinkIds: [taskLink.id]
    });
    const timeBlock = createTimeBlock({
      id: "block-1",
      periodId: period.id,
      areaId: workArea.id,
      startsAt: "2026-10-09T09:00:00.000Z",
      endsAt: "2026-10-09T10:30:00.000Z",
      taskLinkId: taskLink.id,
      actualMinutes: 80,
      note: "Deep work"
    });
    const review = createReview({
      id: "review-1",
      periodId: period.id,
      type: "weekly",
      wins: ["Schema slice completed"],
      misses: ["Migration took longer than planned"],
      adjustments: ["Keep persistence tests small"],
      plannedMinutes: 90,
      actualMinutes: 80,
      createdAt: "2026-10-09T12:00:00.000Z"
    });

    await repository.createArea(workArea);
    await repository.createArea(learningArea);
    await repository.createGoal(goal);
    await repository.createLearningTopic(topic);
    await repository.createTaskLink(taskLink);
    await repository.createPlanningPeriod(period);
    await repository.createTimeBlock(timeBlock);
    await repository.createReview(review);

    await expect(repository.listAreas()).resolves.toEqual([
      learningArea,
      workArea
    ]);
    await expect(repository.getPlanningPeriod(period.id)).resolves.toEqual(
      period
    );
    await expect(repository.listTimeBlocksForPeriod(period.id)).resolves.toEqual(
      [timeBlock]
    );
    await expect(repository.listReviewsForPeriod(period.id)).resolves.toEqual([
      review
    ]);

    await expect(repository.exportPlanningData()).resolves.toEqual({
      areas: [learningArea, workArea],
      goals: [goal],
      learningTopics: [topic],
      planningPeriods: [period],
      timeBlocks: [timeBlock],
      reviews: [review],
      taskLinks: [taskLink],
      syncCursors: []
    });
  });

  it("upserts provider sync cursors", async () => {
    const repository = await createTestRepository();

    await repository.upsertSyncCursor({
      provider: "vikunja",
      cursor: "page=2",
      lastSyncedAt: "2026-10-09T13:00:00.000Z",
      status: "ok"
    });
    await repository.upsertSyncCursor({
      provider: "vikunja",
      cursor: "page=3",
      lastSyncedAt: "2026-10-09T14:00:00.000Z",
      status: "failed",
      error: "timeout"
    });

    await expect(repository.getSyncCursor("vikunja")).resolves.toEqual({
      provider: "vikunja",
      cursor: "page=3",
      lastSyncedAt: "2026-10-09T14:00:00.000Z",
      status: "failed",
      error: "timeout"
    });
  });
});

async function createTestRepository() {
  const databasePath = join(tmpdir(), `planner-${randomUUID()}.sqlite`);
  const connection = createPlannerDatabase({
    url: `file:${databasePath}`
  });

  testDatabases.push({ connection, path: databasePath });
  await migratePlannerDatabase(connection.db);

  return createPlanningRepository(connection.db);
}
