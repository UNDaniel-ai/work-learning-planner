import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Goal, LearningTopic } from "../domain/planning/types";
import { GoalPicker } from "./goal-picker";

const goals: Goal[] = [
  {
    id: "goal-1",
    areaId: "area-work",
    title: "Ship planner MVP",
    horizon: "quarter",
    status: "active",
    createdAt: "2026-10-09T00:00:00.000Z"
  }
];

const topics: LearningTopic[] = [
  {
    id: "topic-1",
    areaId: "area-learning",
    title: "TypeScript testing",
    progressPercent: 40,
    status: "active",
    createdAt: "2026-10-09T00:00:00.000Z"
  }
];

describe("GoalPicker", () => {
  it("renders work goals and learning topics with separate create forms", () => {
    render(
      <GoalPicker
        goals={goals}
        learningTopics={topics}
        onCreateGoal={vi.fn()}
        onCreateLearningTopic={vi.fn()}
      />
    );

    expect(screen.getByRole("heading", { name: "Goals" })).toBeVisible();
    expect(screen.getByText("Ship planner MVP")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Learning topics" })).toBeVisible();
    expect(screen.getByText("TypeScript testing")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Create goal" })
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Add learning topic" })
    ).toBeVisible();
  });

  it("submits normalized goal and learning topic inputs", async () => {
    const onCreateGoal = vi.fn().mockResolvedValue(undefined);
    const onCreateLearningTopic = vi.fn().mockResolvedValue(undefined);

    render(
      <GoalPicker
        goals={[]}
        learningTopics={[]}
        onCreateGoal={onCreateGoal}
        onCreateLearningTopic={onCreateLearningTopic}
      />
    );

    fireEvent.change(screen.getByLabelText("Goal title"), {
      target: { value: "  Improve planning  " }
    });
    fireEvent.change(screen.getByLabelText("Goal horizon"), {
      target: { value: "month" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Create goal" }));

    expect(onCreateGoal).toHaveBeenCalledWith({
      title: "Improve planning",
      horizon: "month"
    });

    fireEvent.change(screen.getByLabelText("Learning topic"), {
      target: { value: "  Vitest fundamentals  " }
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Add learning topic" })
    );

    expect(onCreateLearningTopic).toHaveBeenCalledWith({
      title: "Vitest fundamentals"
    });
  });
});
