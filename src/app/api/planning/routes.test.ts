import { describe, expect, it, vi } from "vitest";
import type {
  Goal,
  LearningTopic,
  PlanningPeriod,
  TimeBlock
} from "../../../domain/planning/types";
import type { PlannerTask } from "../../../domain/tasks/provider";
import { GET as getGoals, POST as postGoal } from "./goals/route";
import {
  GET as getTopics,
  POST as postTopic
} from "./learning-topics/route";
import { GET as getTasks } from "./tasks/route";
import { POST as postTimeBlock } from "./time-blocks/route";
import { GET as getWeekly, POST as postWeekly } from "./weekly/route";

const mocks = vi.hoisted(() => {
  const goal: Goal = {
    id: "goal-1",
    areaId: "area-work",
    title: "Ship planner MVP",
    horizon: "quarter",
    status: "active",
    createdAt: "2026-10-09T00:00:00.000Z"
  };
  const topic: LearningTopic = {
    id: "topic-1",
    areaId: "area-learning",
    title: "TypeScript testing",
    progressPercent: 40,
    status: "active",
    createdAt: "2026-10-09T00:00:00.000Z"
  };
  const period: PlanningPeriod = {
    id: "period-1",
    type: "week",
    startsOn: "2026-10-05",
    endsOn: "2026-10-11",
    focusGoalIds: ["goal-1"],
    taskLinkIds: []
  };
  const timeBlock: TimeBlock = {
    id: "block-1",
    periodId: "period-1",
    areaId: "area-work",
    startsAt: "2026-10-09T09:00:00.000Z",
    endsAt: "2026-10-09T10:00:00.000Z",
    durationMinutes: 60,
    note: "Deep work"
  };
  const task: PlannerTask = {
    id: "task-1",
    title: "Draft weekly plan",
    status: "open",
    labels: ["work"],
    createdAt: "2026-10-09T00:00:00.000Z",
    updatedAt: "2026-10-09T00:00:00.000Z"
  };

  return {
    goal,
    topic,
    period,
    timeBlock,
    task,
    repository: {
      listAreas: vi.fn(async () => [
        { id: "area-learning", name: "Learning", kind: "learning" },
        { id: "area-work", name: "Work", kind: "work" }
      ]),
      listGoals: vi.fn(async () => [goal]),
      listLearningTopics: vi.fn(async () => [topic]),
      listPlanningPeriods: vi.fn(async () => [period]),
      listTimeBlocks: vi.fn(async () => [timeBlock])
    },
    useCases: {
      createGoal: vi.fn(async () => goal),
      createLearningTopic: vi.fn(async () => topic),
      createWeeklyPlan: vi.fn(async () => period),
      scheduleTimeBlock: vi.fn(async () => timeBlock)
    },
    taskProvider: {
      listTasks: vi.fn(async () => [task])
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

describe("planning API routes", () => {
  it("reads and creates goals with the planning use cases", async () => {
    const getResponse = await getGoals();

    expect(getResponse.status).toBe(200);
    await expect(getResponse.json()).resolves.toEqual({
      areas: [
        { id: "area-learning", name: "Learning", kind: "learning" },
        { id: "area-work", name: "Work", kind: "work" }
      ],
      goals: [mocks.goal],
      learningTopics: [mocks.topic]
    });

    const postResponse = await postGoal(
      new Request("http://localhost/api/planning/goals", {
        method: "POST",
        body: JSON.stringify({
          areaId: "area-work",
          title: "  Improve planning  ",
          horizon: "month"
        }),
        headers: { "Content-Type": "application/json" }
      })
    );

    expect(postResponse.status).toBe(201);
    expect(mocks.useCases.createGoal).toHaveBeenCalledWith({
      id: expect.any(String),
      areaId: "area-work",
      title: "  Improve planning  ",
      horizon: "month"
    });
  });

  it("creates learning topics and lists weekly data and tasks", async () => {
    const topicResponse = await postTopic(
      new Request("http://localhost/api/planning/learning-topics", {
        method: "POST",
        body: JSON.stringify({
          areaId: "area-learning",
          title: "  Vitest fundamentals  "
        }),
        headers: { "Content-Type": "application/json" }
      })
    );

    expect(topicResponse.status).toBe(201);
    expect(mocks.useCases.createLearningTopic).toHaveBeenCalledWith({
      id: expect.any(String),
      areaId: "area-learning",
      title: "  Vitest fundamentals  ",
      progressPercent: 0
    });

    await expect((await getTopics()).json()).resolves.toEqual({
      areas: [
        { id: "area-learning", name: "Learning", kind: "learning" },
        { id: "area-work", name: "Work", kind: "work" }
      ],
      learningTopics: [mocks.topic]
    });
    await expect((await getWeekly()).json()).resolves.toEqual({
      planningPeriods: [mocks.period],
      timeBlocks: [mocks.timeBlock]
    });
    await expect((await getTasks()).json()).resolves.toEqual({
      tasks: [mocks.task]
    });
  });

  it("creates weekly plans and time blocks through use cases", async () => {
    const weeklyResponse = await postWeekly(
      new Request("http://localhost/api/planning/weekly", {
        method: "POST",
        body: JSON.stringify({
          anchorDate: "2026-10-09",
          focusGoalIds: ["goal-1"],
          tasks: []
        }),
        headers: { "Content-Type": "application/json" }
      })
    );

    expect(weeklyResponse.status).toBe(201);
    expect(mocks.useCases.createWeeklyPlan).toHaveBeenCalledWith({
      id: expect.any(String),
      anchorDate: "2026-10-09",
      focusGoalIds: ["goal-1"],
      tasks: []
    });

    const timeBlockResponse = await postTimeBlock(
      new Request("http://localhost/api/planning/time-blocks", {
        method: "POST",
        body: JSON.stringify({
          periodId: "period-1",
          areaId: "area-work",
          startsAt: "2026-10-09T09:00:00.000Z",
          endsAt: "2026-10-09T10:00:00.000Z",
          note: "Deep work"
        }),
        headers: { "Content-Type": "application/json" }
      })
    );

    expect(timeBlockResponse.status).toBe(201);
    expect(mocks.useCases.scheduleTimeBlock).toHaveBeenCalledWith({
      id: expect.any(String),
      periodId: "period-1",
      areaId: "area-work",
      startsAt: "2026-10-09T09:00:00.000Z",
      endsAt: "2026-10-09T10:00:00.000Z",
      note: "Deep work"
    });
  });
});
