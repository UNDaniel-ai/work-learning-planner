import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PlanningPeriod, Review } from "../domain/planning/types";
import { ReviewWorkspace } from "./review-workspace";

const period: PlanningPeriod = {
  id: "period-1",
  type: "week",
  startsOn: "2026-10-05",
  endsOn: "2026-10-11",
  focusGoalIds: [],
  taskLinkIds: []
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

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ReviewWorkspace", () => {
  it("loads the current period and saves a review", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          planningPeriods: [period],
          timeBlocks: []
        })
      )
      .mockResolvedValueOnce(jsonResponse({ reviews: [] }))
      .mockResolvedValueOnce(jsonResponse(review, 201));
    vi.stubGlobal("fetch", fetchMock);

    render(<ReviewWorkspace date="2026-10-09" />);

    expect(await screen.findByText("Close the loop")).toBeVisible();
    fireEvent.change(screen.getByLabelText("Wins"), {
      target: { value: "Shipped a slice" }
    });
    fireEvent.change(screen.getByLabelText("Actual minutes"), {
      target: { value: "45" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Save review" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/planning/reviews",
        expect.objectContaining({ method: "POST" })
      );
    });
    expect(await screen.findByText("Shipped a slice")).toBeVisible();
    expect(screen.getByText("-15 min")).toBeVisible();
  });
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
