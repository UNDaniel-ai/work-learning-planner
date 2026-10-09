import { describe, expect, it } from "vitest";
import {
  addTimeBlock,
  createGoal,
  createLearningTopic,
  createReview,
  createTimeBlock,
  createWeeklyPlanningPeriod
} from "./rules";

describe("planning domain rules", () => {
  it("creates an active goal with normalized title", () => {
    const goal = createGoal({
      id: "goal-1",
      areaId: "area-work",
      title: "  Ship the first planner MVP  ",
      horizon: "quarter",
      createdAt: "2026-10-09T00:00:00.000Z"
    });

    expect(goal).toMatchObject({
      id: "goal-1",
      areaId: "area-work",
      title: "Ship the first planner MVP",
      horizon: "quarter",
      status: "active"
    });
  });

  it("rejects blank titles for goals and learning topics", () => {
    expect(() =>
      createGoal({
        id: "goal-blank",
        areaId: "area-work",
        title: "  ",
        horizon: "month",
        createdAt: "2026-10-09T00:00:00.000Z"
      })
    ).toThrow(/title/i);

    expect(() =>
      createLearningTopic({
        id: "topic-blank",
        areaId: "area-learning",
        title: "",
        progressPercent: 0,
        createdAt: "2026-10-09T00:00:00.000Z"
      })
    ).toThrow(/title/i);
  });

  it("creates an active learning topic with bounded progress", () => {
    const topic = createLearningTopic({
      id: "topic-1",
      areaId: "area-learning",
      title: "TypeScript testing",
      progressPercent: 42,
      createdAt: "2026-10-09T00:00:00.000Z"
    });

    expect(topic).toMatchObject({
      id: "topic-1",
      title: "TypeScript testing",
      progressPercent: 42,
      status: "active"
    });

    expect(() =>
      createLearningTopic({
        id: "topic-overflow",
        areaId: "area-learning",
        title: "Too much",
        progressPercent: 101,
        createdAt: "2026-10-09T00:00:00.000Z"
      })
    ).toThrow(/progress/i);
  });

  it("creates a Monday-based weekly planning period from an anchor date", () => {
    const period = createWeeklyPlanningPeriod({
      id: "week-1",
      anchorDate: "2026-10-09",
      focusGoalIds: ["goal-1"],
      taskLinkIds: ["task-1"]
    });

    expect(period).toEqual({
      id: "week-1",
      type: "week",
      startsOn: "2026-10-05",
      endsOn: "2026-10-11",
      focusGoalIds: ["goal-1"],
      taskLinkIds: ["task-1"]
    });
  });

  it("accepts non-overlapping time blocks inside the planning period", () => {
    const period = createWeeklyPlanningPeriod({
      id: "week-1",
      anchorDate: "2026-10-09"
    });
    const first = createTimeBlock({
      id: "block-1",
      periodId: period.id,
      areaId: "area-work",
      startsAt: "2026-10-09T09:00:00.000Z",
      endsAt: "2026-10-09T10:00:00.000Z"
    });
    const second = createTimeBlock({
      id: "block-2",
      periodId: period.id,
      areaId: "area-learning",
      startsAt: "2026-10-09T10:00:00.000Z",
      endsAt: "2026-10-09T11:30:00.000Z"
    });

    const blocks = addTimeBlock(period, [first], second);

    expect(first.durationMinutes).toBe(60);
    expect(second.durationMinutes).toBe(90);
    expect(blocks.map((block) => block.id)).toEqual(["block-1", "block-2"]);
  });

  it("rejects overlapping time blocks", () => {
    const period = createWeeklyPlanningPeriod({
      id: "week-1",
      anchorDate: "2026-10-09"
    });
    const existing = createTimeBlock({
      id: "block-1",
      periodId: period.id,
      areaId: "area-work",
      startsAt: "2026-10-09T09:00:00.000Z",
      endsAt: "2026-10-09T10:00:00.000Z"
    });
    const overlapping = createTimeBlock({
      id: "block-2",
      periodId: period.id,
      areaId: "area-learning",
      startsAt: "2026-10-09T09:30:00.000Z",
      endsAt: "2026-10-09T10:30:00.000Z"
    });

    expect(() => addTimeBlock(period, [existing], overlapping)).toThrow(
      /overlap/i
    );
  });

  it("rejects time blocks outside the planning period", () => {
    const period = createWeeklyPlanningPeriod({
      id: "week-1",
      anchorDate: "2026-10-09"
    });
    const outside = createTimeBlock({
      id: "block-outside",
      periodId: period.id,
      areaId: "area-work",
      startsAt: "2026-10-12T09:00:00.000Z",
      endsAt: "2026-10-12T10:00:00.000Z"
    });

    expect(() => addTimeBlock(period, [], outside)).toThrow(/outside/i);
  });

  it("creates a review with planned versus actual variance", () => {
    const review = createReview({
      id: "review-1",
      periodId: "week-1",
      type: "weekly",
      wins: ["Finished the first two implementation steps"],
      misses: ["Underestimated setup edge cases"],
      adjustments: ["Keep slices small"],
      plannedMinutes: 300,
      actualMinutes: 240,
      createdAt: "2026-10-09T12:00:00.000Z"
    });

    expect(review).toMatchObject({
      id: "review-1",
      periodId: "week-1",
      type: "weekly",
      plannedMinutes: 300,
      actualMinutes: 240,
      varianceMinutes: -60
    });
  });
});
