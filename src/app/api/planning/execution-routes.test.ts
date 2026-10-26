import { describe, expect, it, vi } from "vitest";
import type {
  PlanningPeriod,
  Review,
  TaskLink,
  TimeBlock
} from "../../../domain/planning/types";
import type {
  EvidenceItem,
  KnowledgeCard,
  LearningModule,
  StudySession
} from "../../../domain/learning/types";
import type { PlannerTask } from "../../../domain/tasks/provider";
import { GET as getToday } from "./today/route";
import {
  GET as getReviews,
  POST as postReview
} from "./reviews/route";
import { PATCH as patchTask } from "./tasks/route";
import { PATCH as patchTimeBlock } from "./time-blocks/route";
import { GET as getWeekly } from "./weekly/route";

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
  const learningModule: LearningModule = {
    id: "module-attention",
    trackId: "track-cs336",
    title: "Attention and RoPE",
    sequence: 5,
    status: "active",
    expectedOutcome: "Explain causal masking and output shapes.",
    acceptanceCriteria: ["Pass a toy tensor check."],
    markdownPath: "learning/cs336/modules/05-attention-and-rope.md",
    createdAt: "2026-10-09T08:00:00.000Z",
    updatedAt: "2026-10-09T08:00:00.000Z"
  };
  const learningSession: StudySession = {
    id: "session-attention",
    moduleId: learningModule.id,
    planningPeriodId: period.id,
    timeBlockId: timeBlock.id,
    status: "active",
    question: "Where should the causal mask be applied?",
    preUnderstanding: "Before softmax, I think.",
    markdownPath: "learning/cs336/sessions/2026-10-09-attention.md",
    createdAt: "2026-10-09T09:00:00.000Z",
    updatedAt: "2026-10-09T09:00:00.000Z"
  };
  const blockedSession: StudySession = {
    ...learningSession,
    id: "session-rope",
    timeBlockId: undefined,
    status: "blocked",
    question: "Why are frequencies paired across dimensions?",
    blocker: "The rotation layout is still unclear.",
    createdAt: "2026-10-10T09:00:00.000Z",
    updatedAt: "2026-10-10T09:30:00.000Z"
  };
  const evidence: EvidenceItem = {
    id: "evidence-mask",
    sessionId: learningSession.id,
    kind: "toy_example",
    title: "Two-token causal mask",
    summary: "The future token receives a masked logit.",
    reference: "tests/test_attention.py::test_causal_mask",
    result: "pass",
    markdownPath: "learning/cs336/experiments/attention-mask.md",
    createdAt: "2026-10-09T09:30:00.000Z"
  };
  const knowledgeCard: KnowledgeCard = {
    id: "card-attention",
    trackId: learningModule.trackId,
    moduleId: learningModule.id,
    title: "Scaled dot-product attention",
    slug: "scaled-dot-product-attention",
    sourceIds: ["source-cs336"],
    evidenceIds: [evidence.id],
    relatedCardIds: [],
    maturity: "verified",
    confidence: 4,
    summary: "Apply the causal mask before softmax.",
    markdownPath: "learning/cs336/knowledge/scaled-dot-product-attention.md",
    createdAt: "2026-10-09T10:00:00.000Z",
    updatedAt: "2026-10-09T10:00:00.000Z"
  };
  const learningSessions = [
    { session: learningSession, module: learningModule },
    { session: blockedSession, module: learningModule }
  ];
  const learning = {
    sessions: learningSessions,
    evidence: [evidence],
    knowledgeCards: [knowledgeCard],
    blockedQuestions: [
      {
        sessionId: blockedSession.id,
        moduleId: learningModule.id,
        moduleTitle: learningModule.title,
        question: blockedSession.question,
        blocker: blockedSession.blocker
      }
    ]
  };

  return {
    period,
    timeBlock,
    taskLink,
    task,
    review,
    learningModule,
    learningSession,
    blockedSession,
    evidence,
    knowledgeCard,
    learningSessions,
    learning,
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
    },
    learningRepository: {
      listSessionSummaries: vi.fn(async (filter?: {
        planningPeriodId?: string;
        timeBlockIds?: string[];
      }) => {
        if (filter?.timeBlockIds) {
          return learningSessions.filter(({ session }) =>
            session.timeBlockId
              ? filter.timeBlockIds?.includes(session.timeBlockId)
              : false
          );
        }

        if (filter?.planningPeriodId) {
          return learningSessions.filter(
            ({ session }) => session.planningPeriodId === filter.planningPeriodId
          );
        }

        return learningSessions;
      }),
      getPeriodLearningSummary: vi.fn(async () => learning)
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

vi.mock("../../../lib/learning/runtime", () => ({
  getLearningRuntime: vi.fn(async () => ({
    repository: mocks.learningRepository
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
      tasks: [mocks.task],
      learningSessions: [
        {
          session: mocks.learningSession,
          module: mocks.learningModule
        }
      ]
    });
  });

  it("loads weekly learning sessions and period review outputs", async () => {
    await expect((await getWeekly()).json()).resolves.toEqual({
      planningPeriods: [mocks.period],
      timeBlocks: [mocks.timeBlock],
      learningSessions: mocks.learningSessions
    });

    await expect(
      (
        await getReviews(
          new Request(
            "http://localhost/api/planning/reviews?periodId=period-1"
          )
        )
      ).json()
    ).resolves.toEqual({
      reviews: [mocks.review],
      learning: mocks.learning
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
      reviews: [mocks.review],
      learning: mocks.learning
    });
  });
});
