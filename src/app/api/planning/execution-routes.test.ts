import { describe, expect, it, vi } from "vitest";
import type {
  PlanningPeriod,
  Review,
  TaskLink,
  TimeBlock
} from "../../../domain/planning/types";
import type { PlannerTask } from "../../../domain/tasks/provider";
import { GET as getToday } from "./today/route";
import {
  GET as getReviews,
  POST as postReview
} from "./reviews/route";
import { PATCH as patchTask } from "./tasks/route";
import { PATCH as patchTimeBlock } from "./time-blocks/route";

const mocks = vi.hoisted(() => {
  const period: PlanningPeriod = {
    id: "period-1",
    type: "week",
    startsOn: "2026-10-05",
    endsOn: "2026-10-11",
    focusGoalIds: ["goal-1"],
    taskLinkIds: ["task-link-1"]
  };
  const timeBlock: TimeBlock = {
    id: "block-1",
    periodId: "period-1",
    areaId: "area-work",
    startsAt: "2026-10-09T09:00:00.000Z",
    endsAt: "2026-10-09T10:00:00.000Z",
    durationMinutes: 60,
    actualMinutes: 45,
    taskLinkId: "task-link-1",
    note: "Focused implementation"
  };
  const taskLink: TaskLink = {
    id: "task-link-1",
    provider: "vikunja",
    externalTaskId: "task-1",
    titleSnapshot: "Draft weekly plan"
  };
  const task: PlannerTask = {
    id: "task-1",
    title: "Draft weekly plan",
    status: "open",
    labels: ["work"],
    createdAt: "2026-10-09T00:00:00.000Z",
    updatedAt: "2026-10-09T00:00:00.000Z"
  };
  const review: Review = {
    id: "review-1",
    periodId: "period-1",
    type: "weekly",
    wins: ["Shipped a slice"],
    misses: [],
    adjustments: ["Keep scope small"],
    plannedMinutes: 60,
    actualMinutes: 45,
    varianceMinutes: -15,
    createdAt: "2026-10-09T18:00:00.000Z"
  };

  return {
    period,
    timeBlock,
    taskLink,
    task,
    review,
    repository: {
      listPlanningPeriods: vi.fn(async () => [period]),
      listTimeBlocks: vi.fn(async () => [timeBlock]),
      listTaskLinks: vi.fn(async () => [taskLink]),
      listReviewsForPeriod: vi.fn(async () => [review])
    },
    useCases: {
      recordTimeBlockActual: vi.fn(async () => timeBlock),
      recordReview: vi.fn(async () => review)
    },
    taskProvider: {
      listTasks: vi.fn(async () => [task]),
      completeTask: vi.fn(async () => ({ ...task, status: "completed" as const })),
      postponeTask: vi.fn(async (_id: string, dueDate: string) => ({
        ...task,
        dueDate
      }))
    }
  };
});

vi.mock("../../../lib/planning/runtime", () => ({
  getPlanningRuntime: vi.fn(async () => ({
    repository: mocks.repository,
    useCases: mocks.useCases,
    taskProvider: mocks.taskProvider
  }))
}));

describe("planning execution API routes", () => {
  it("loads today's linked tasks and time blocks", async () => {
    const response = await getToday(
      new Request(
        "http://localhost/api/planning/today?date=2026-10-09"
      )
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      date: "2026-10-09",
      planningPeriod: mocks.period,
      timeBlocks: [mocks.timeBlock],
      tasks: [mocks.task]
    });
  });

  it("completes or postpones a task through the provider", async () => {
    const completeResponse = await patchTask(
      new Request("http://localhost/api/planning/tasks", {
        method: "PATCH",
        body: JSON.stringify({ id: "task-1", action: "complete" }),
        headers: { "Content-Type": "application/json" }
      })
    );
    const postponeResponse = await patchTask(
      new Request("http://localhost/api/planning/tasks", {
        method: "PATCH",
        body: JSON.stringify({
          id: "task-1",
          action: "postpone",
          dueDate: "2026-10-12"
        }),
        headers: { "Content-Type": "application/json" }
      })
    );

    expect(completeResponse.status).toBe(200);
    expect(postponeResponse.status).toBe(200);
    expect(mocks.taskProvider.completeTask).toHaveBeenCalledWith("task-1");
    expect(mocks.taskProvider.postponeTask).toHaveBeenCalledWith(
      "task-1",
      "2026-10-12"
    );
  });

  it("records actual time and saves review data", async () => {
    const timeResponse = await patchTimeBlock(
      new Request("http://localhost/api/planning/time-blocks", {
        method: "PATCH",
        body: JSON.stringify({ id: "block-1", actualMinutes: 45 }),
        headers: { "Content-Type": "application/json" }
      })
    );
    const reviewResponse = await postReview(
      new Request("http://localhost/api/planning/reviews", {
        method: "POST",
        body: JSON.stringify({
          periodId: "period-1",
          type: "daily",
          date: "2026-10-09",
          wins: ["Shipped a slice"],
          misses: [],
          adjustments: ["Keep scope small"]
        }),
        headers: { "Content-Type": "application/json" }
      })
    );

    expect(timeResponse.status).toBe(200);
    expect(reviewResponse.status).toBe(201);
    expect(mocks.useCases.recordTimeBlockActual).toHaveBeenCalledWith({
      id: "block-1",
      actualMinutes: 45
    });
    expect(mocks.useCases.recordReview).toHaveBeenCalledWith({
      id: expect.any(String),
      periodId: "period-1",
      type: "daily",
      date: "2026-10-09",
      wins: ["Shipped a slice"],
      misses: [],
      adjustments: ["Keep scope small"]
    });
    await expect((await getReviews(
      new Request(
        "http://localhost/api/planning/reviews?periodId=period-1"
      )
    )).json()).resolves.toEqual({
      reviews: [mocks.review]
    });
  });
});
