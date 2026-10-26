import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PlanningPeriod, TimeBlock } from "../domain/planning/types";
import type { LearningModule, StudySession } from "../domain/learning/types";
import type { PlannerTask } from "../domain/tasks/provider";
import { TodayWorkspace } from "./today-workspace";

const period: PlanningPeriod = {
  id: "period-1",
  type: "week",
  startsOn: "2026-10-05",
  endsOn: "2026-10-11",
  focusGoalIds: [],
  taskLinkIds: ["task-link-1"]
};

const task: PlannerTask = {
  id: "task-1",
  title: "Draft weekly plan",
  status: "open",
  labels: ["work"],
  createdAt: "2026-10-09T00:00:00.000Z",
  updatedAt: "2026-10-09T00:00:00.000Z"
};

const block: TimeBlock = {
  id: "block-1",
  periodId: "period-1",
  areaId: "area-work",
  startsAt: "2026-10-09T09:00:00.000Z",
  endsAt: "2026-10-09T10:00:00.000Z",
  durationMinutes: 60,
  note: "Focused implementation"
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
  timeBlockId: block.id,
  status: "active",
  question: "Where should the causal mask be applied?",
  preUnderstanding: "Before softmax, I think.",
  markdownPath: "learning/cs336/sessions/2026-10-09-attention.md",
  createdAt: "2026-10-09T09:00:00.000Z",
  updatedAt: "2026-10-09T09:00:00.000Z"
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("TodayWorkspace", () => {
  it("loads today's work, records actual time, completes, and postpones a task", async () => {
    const completedTask = { ...task, status: "completed" as const };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          date: "2026-10-09",
          planningPeriod: period,
          timeBlocks: [block],
          tasks: [task],
          learningSessions: [
            { session: learningSession, module: learningModule }
          ]
        })
      )
      .mockResolvedValueOnce(jsonResponse({ ...block, actualMinutes: 45 }))
      .mockResolvedValueOnce(
        jsonResponse({ ...task, dueDate: "2026-10-12" })
      )
      .mockResolvedValueOnce(jsonResponse(completedTask));
    vi.stubGlobal("fetch", fetchMock);

    render(<TodayWorkspace date="2026-10-09" />);

    expect(await screen.findByText("Draft weekly plan")).toBeVisible();
    expect(screen.getByText("Focused implementation")).toBeVisible();
    expect(screen.getByText("Attention and RoPE")).toBeVisible();
    expect(
      screen.getByText("Where should the causal mask be applied?")
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Continue learning session" })
    ).toHaveAttribute("href", "/learning/sessions/session-attention");

    fireEvent.change(screen.getByLabelText("Actual minutes for Focused implementation"), {
      target: { value: "45" }
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Save actual time" })
    );
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/planning/time-blocks",
        expect.objectContaining({ method: "PATCH" })
      );
    });

    fireEvent.change(screen.getByLabelText("Postpone date"), {
      target: { value: "2026-10-12" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Postpone task" }));
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    fireEvent.click(screen.getByRole("button", { name: "Complete task" }));
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/planning/tasks",
        expect.objectContaining({ method: "PATCH" })
      );
    });
  });
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
