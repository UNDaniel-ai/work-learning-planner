import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Goal, LearningTopic } from "../domain/planning/types";
import { GoalsWorkspace } from "./goals-workspace";

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

const newGoal: Goal = {
  ...goal,
  id: "goal-2",
  title: "Improve planning",
  horizon: "month"
};

const newTopic: LearningTopic = {
  ...topic,
  id: "topic-2",
  title: "Vitest fundamentals",
  progressPercent: 0
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("GoalsWorkspace", () => {
  it("loads, creates, and displays work goals and learning topics", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          areas: [
            { id: "area-work", name: "Work", kind: "work" },
            { id: "area-learning", name: "Learning", kind: "learning" }
          ],
          goals: [goal],
          learningTopics: [topic]
        })
      )
      .mockResolvedValueOnce(jsonResponse(newGoal, 201))
      .mockResolvedValueOnce(jsonResponse(newTopic, 201));
    vi.stubGlobal("fetch", fetchMock);

    render(<GoalsWorkspace />);

    expect(await screen.findByText("Ship planner MVP")).toBeVisible();
    expect(screen.getByText("TypeScript testing")).toBeVisible();

    fireEvent.change(screen.getByLabelText("Goal title"), {
      target: { value: " Improve planning " }
    });
    fireEvent.change(screen.getByLabelText("Goal horizon"), {
      target: { value: "month" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Create goal" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/planning/goals",
        expect.objectContaining({ method: "POST" })
      );
    });
    expect(JSON.parse(fetchMock.mock.calls[1][1]?.body as string)).toEqual({
      areaId: "area-work",
      title: "Improve planning",
      horizon: "month"
    });
    expect(await screen.findByText("Improve planning")).toBeVisible();

    fireEvent.change(screen.getByLabelText("Learning topic"), {
      target: { value: " Vitest fundamentals " }
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Add learning topic" })
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/planning/learning-topics",
        expect.objectContaining({ method: "POST" })
      );
    });
    expect(JSON.parse(fetchMock.mock.calls[2][1]?.body as string)).toEqual({
      areaId: "area-learning",
      title: "Vitest fundamentals"
    });
    expect(await screen.findByText("Vitest fundamentals")).toBeVisible();
  });
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
