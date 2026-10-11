import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Goal, PlanningPeriod, TimeBlock } from "../domain/planning/types";
import type { PlannerTask } from "../domain/tasks/provider";
import { WeeklyPlanner } from "./weekly-planner";

const goal: Goal = {
  id: "goal-1",
  areaId: "area-work",
  title: "Ship planner MVP",
  horizon: "quarter",
  status: "active",
  createdAt: "2026-10-09T00:00:00.000Z"
};

const task: PlannerTask = {
  id: "task-1",
  title: "Draft weekly plan",
  status: "open",
  projectId: "project-1",
  dueDate: "2026-10-10",
  labels: ["work"],
  createdAt: "2026-10-09T00:00:00.000Z",
  updatedAt: "2026-10-09T00:00:00.000Z"
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
  startsAt: "2026-10-07T09:00:00.000Z",
  endsAt: "2026-10-07T10:30:00.000Z",
  durationMinutes: 90,
  note: "Focused implementation"
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("WeeklyPlanner", () => {
  it("creates a weekly plan from selected goals and tasks, then schedules time", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          areas: [
            { id: "area-work", name: "Work", kind: "work" },
            { id: "area-learning", name: "Learning", kind: "learning" }
          ],
          goals: [goal],
          learningTopics: []
        })
      )
      .mockResolvedValueOnce(jsonResponse({ tasks: [task] }))
      .mockResolvedValueOnce(
        jsonResponse({ planningPeriods: [], timeBlocks: [] })
      )
      .mockResolvedValueOnce(jsonResponse(period, 201))
      .mockResolvedValueOnce(jsonResponse(timeBlock, 201));
    vi.stubGlobal("fetch", fetchMock);

    render(<WeeklyPlanner anchorDate="2026-10-07" />);

    expect(await screen.findByText("Ship planner MVP")).toBeVisible();
    expect(screen.getByText("Draft weekly plan")).toBeVisible();

    fireEvent.click(screen.getByLabelText("Focus Ship planner MVP"));
    fireEvent.click(screen.getByLabelText("Select Draft weekly plan"));
    fireEvent.click(screen.getByRole("button", { name: "Create weekly plan" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/planning/weekly",
        expect.objectContaining({ method: "POST" })
      );
    });
    expect(JSON.parse(fetchMock.mock.calls[3][1]?.body as string)).toEqual({
      anchorDate: "2026-10-07",
      focusGoalIds: ["goal-1"],
      tasks: [
        {
          taskLinkId: expect.any(String),
          title: "Draft weekly plan",
          projectId: "project-1",
          dueDate: "2026-10-10",
          labels: ["work"]
        }
      ]
    });

    fireEvent.change(await screen.findByLabelText("Start"), {
      target: { value: "09:00" }
    });
    fireEvent.change(screen.getByLabelText("End"), {
      target: { value: "10:30" }
    });
    fireEvent.change(screen.getByLabelText("Note"), {
      target: { value: "Focused implementation" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Add time block" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/planning/time-blocks",
        expect.objectContaining({ method: "POST" })
      );
    });
    expect(JSON.parse(fetchMock.mock.calls[4][1]?.body as string)).toEqual({
      periodId: "period-1",
      areaId: "area-work",
      startsAt: "2026-10-07T09:00:00.000Z",
      endsAt: "2026-10-07T10:30:00.000Z",
      note: "Focused implementation"
    });
    expect(await screen.findByText("Focused implementation")).toBeVisible();
    expect(screen.getByText("1.5h")).toBeVisible();
  });

  it("shows saved weekly periods and time blocks after loading", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          areas: [],
          goals: [goal],
          learningTopics: []
        })
      )
      .mockResolvedValueOnce(jsonResponse({ tasks: [task] }))
      .mockResolvedValueOnce(
        jsonResponse({ planningPeriods: [period], timeBlocks: [timeBlock] })
      );
    vi.stubGlobal("fetch", fetchMock);

    render(<WeeklyPlanner anchorDate="2026-10-07" />);

    expect(await screen.findByText("Week saved")).toBeVisible();
    expect(screen.getByText("Focused implementation")).toBeVisible();
    expect(screen.getByLabelText("Focus Ship planner MVP")).toBeChecked();
    expect(screen.getByText("1.5h")).toBeVisible();
  });

  it("keeps the saved period selected when an older period is already listed", async () => {
    const olderPeriod: PlanningPeriod = {
      ...period,
      id: "period-older",
      focusGoalIds: []
    };
    const savedPeriod: PlanningPeriod = {
      ...period,
      id: "period-saved",
      focusGoalIds: ["goal-1"]
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          areas: [],
          goals: [goal],
          learningTopics: []
        })
      )
      .mockResolvedValueOnce(jsonResponse({ tasks: [] }))
      .mockResolvedValueOnce(
        jsonResponse({ planningPeriods: [olderPeriod], timeBlocks: [] })
      )
      .mockResolvedValueOnce(jsonResponse(savedPeriod, 201))
      .mockResolvedValueOnce(jsonResponse(timeBlock, 201));
    vi.stubGlobal("fetch", fetchMock);

    render(<WeeklyPlanner anchorDate="2026-10-07" />);

    expect(await screen.findByText("Ship planner MVP")).toBeVisible();
    fireEvent.click(screen.getByLabelText("Focus Ship planner MVP"));
    fireEvent.click(screen.getByRole("button", { name: "Create weekly plan" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/planning/weekly",
        expect.objectContaining({ method: "POST" })
      );
    });

    fireEvent.change(await screen.findByLabelText("Start"), {
      target: { value: "09:00" }
    });
    fireEvent.change(screen.getByLabelText("End"), {
      target: { value: "10:30" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Add time block" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/planning/time-blocks",
        expect.objectContaining({ method: "POST" })
      );
    });
    expect(JSON.parse(fetchMock.mock.calls[4][1]?.body as string)).toEqual({
      periodId: "period-saved",
      areaId: "area-work",
      startsAt: "2026-10-07T09:00:00.000Z",
      endsAt: "2026-10-07T10:30:00.000Z",
      note: undefined
    });
  });
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
