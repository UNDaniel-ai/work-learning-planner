import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createMemoryTaskProvider } from "../../integrations/memory/provider";
import {
  createPlannerDatabase,
  migratePlannerDatabase,
  type PlannerDatabaseConnection
} from "../../lib/db/client";
import { createPlanningRepository } from "../../lib/db/repositories";
import type { Area } from "./types";
import { createPlanningUseCases } from "./use-cases";
import {
  TaskProviderError,
  type TaskProvider
} from "../tasks/provider";

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

describe("planning use cases", () => {
  it("runs the goal to weekly review loop without UI", async () => {
    const { repository, taskProvider, useCases } = await createHarness();
    const workArea: Area = {
      id: "area-work",
      name: "Work",
      kind: "work"
    };
    const learningArea: Area = {
      id: "area-learning",
      name: "Learning",
      kind: "learning"
    };

    await repository.createArea(workArea);
    await repository.createArea(learningArea);

    const goal = await useCases.createGoal({
      id: "goal-1",
      areaId: workArea.id,
      title: "  Ship planner MVP  ",
      horizon: "quarter"
    });
    const topic = await useCases.createLearningTopic({
      id: "topic-1",
      areaId: learningArea.id,
      title: "TypeScript testing",
      progressPercent: 40
    });
    const period = await useCases.createWeeklyPlan({
      id: "period-1",
      anchorDate: "2026-10-09",
      focusGoalIds: [goal.id],
      tasks: [
        {
          taskLinkId: "task-link-1",
          title: "Draft weekly plan",
          dueDate: "2026-10-10",
          labels: ["work", "planning"]
        }
      ]
    });
    const timeBlock = await useCases.scheduleTimeBlock({
      id: "block-1",
      periodId: period.id,
      areaId: workArea.id,
      startsAt: "2026-10-09T09:00:00.000Z",
      endsAt: "2026-10-09T10:30:00.000Z",
      taskLinkId: "task-link-1",
      actualMinutes: 75,
      note: "Focused implementation"
    });
    const review = await useCases.recordReview({
      id: "review-1",
      periodId: period.id,
      type: "weekly",
      wins: ["Persisted the planning loop"],
      misses: ["Need tighter task estimates"],
      adjustments: ["Keep TDD slices small"]
    });

    await expect(taskProvider.listTasks()).resolves.toMatchObject([
      {
        id: "task-1",
        title: "Draft weekly plan",
        dueDate: "2026-10-10",
        labels: ["work", "planning"]
      }
    ]);
    await expect(repository.getPlanningPeriod(period.id)).resolves.toEqual({
      id: "period-1",
      type: "week",
      startsOn: "2026-10-05",
      endsOn: "2026-10-11",
      focusGoalIds: [goal.id],
      taskLinkIds: ["task-link-1"]
    });
    await expect(repository.listTaskLinks()).resolves.toEqual([
      {
        id: "task-link-1",
        provider: "vikunja",
        externalTaskId: "task-1",
        titleSnapshot: "Draft weekly plan"
      }
    ]);
    expect(topic.status).toBe("active");
    expect(timeBlock.durationMinutes).toBe(90);
    expect(review).toMatchObject({
      plannedMinutes: 90,
      actualMinutes: 75,
      varianceMinutes: -15
    });
    await expect(repository.exportPlanningData()).resolves.toMatchObject({
      goals: [goal],
      learningTopics: [topic],
      planningPeriods: [period],
      timeBlocks: [timeBlock],
      reviews: [review]
    });
  });

  it("does not persist local plan data when the task provider fails", async () => {
    const { repository, useCases } = await createHarness(createFailingProvider());

    await expect(
      useCases.createWeeklyPlan({
        id: "period-provider-down",
        anchorDate: "2026-10-09",
        focusGoalIds: [],
        tasks: [
          {
            taskLinkId: "task-link-provider-down",
            title: "This task will not be created"
          }
        ]
      })
    ).rejects.toMatchObject({
      code: "TASK_PROVIDER_ERROR",
      provider: "vikunja"
    });

    await expect(
      repository.getPlanningPeriod("period-provider-down")
    ).resolves.toBeUndefined();
    await expect(repository.listTaskLinks()).resolves.toEqual([]);
  });
});

async function createHarness(taskProvider = createMemoryTaskProvider({
  now: () => "2026-10-09T00:00:00.000Z"
})) {
  const databasePath = join(tmpdir(), `planner-${randomUUID()}.sqlite`);
  const connection = createPlannerDatabase({
    url: `file:${databasePath}`
  });

  testDatabases.push({ connection, path: databasePath });
  await migratePlannerDatabase(connection.db);

  const repository = createPlanningRepository(connection.db);

  return {
    repository,
    taskProvider,
    useCases: createPlanningUseCases({
      repository,
      taskProvider,
      now: () => "2026-10-09T00:00:00.000Z"
    })
  };
}

function createFailingProvider(): TaskProvider {
  async function fail(): Promise<never> {
    throw new TaskProviderError(
      "PROVIDER_UNAVAILABLE",
      "vikunja",
      "Vikunja is not reachable."
    );
  }

  return {
    listTasks: fail,
    createTask: fail,
    updateTask: fail,
    completeTask: fail,
    postponeTask: fail
  };
}
