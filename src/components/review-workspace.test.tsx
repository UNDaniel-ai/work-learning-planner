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
          timeBlocks: [],
          learningSessions: []
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          reviews: [],
          learning: {
            sessions: [
              {
                session: {
                  id: "session-attention",
                  moduleId: "module-attention",
                  planningPeriodId: period.id,
                  status: "blocked",
                  question: "Where should the causal mask be applied?",
                  preUnderstanding: "Before softmax, I think.",
                  blocker: "The mask order is still unclear.",
                  createdAt: "2026-10-09T09:00:00.000Z",
                  updatedAt: "2026-10-09T09:30:00.000Z"
                },
                module: {
                  id: "module-attention",
                  trackId: "track-cs336",
                  title: "Attention and RoPE",
                  sequence: 5,
                  status: "blocked",
                  expectedOutcome: "Explain causal masking.",
                  acceptanceCriteria: ["Pass a toy tensor check."],
                  createdAt: "2026-10-09T08:00:00.000Z",
                  updatedAt: "2026-10-09T08:00:00.000Z"
                }
              }
            ],
            evidence: [
              {
                id: "evidence-mask",
                sessionId: "session-attention",
                kind: "toy_example",
                title: "Two-token causal mask",
                summary: "The future token receives a masked logit.",
                reference: "tests/test_attention.py::test_causal_mask",
                result: "fail",
                createdAt: "2026-10-09T09:20:00.000Z"
              }
            ],
            knowledgeCards: [
              {
                id: "card-attention",
                trackId: "track-cs336",
                moduleId: "module-attention",
                title: "Scaled dot-product attention",
                slug: "scaled-dot-product-attention",
                sourceIds: ["source-cs336"],
                evidenceIds: ["evidence-mask"],
                relatedCardIds: [],
                maturity: "observed",
                confidence: 3,
                summary: "Apply the mask before softmax.",
                createdAt: "2026-10-09T09:40:00.000Z",
                updatedAt: "2026-10-09T09:40:00.000Z"
              }
            ],
            blockedQuestions: [
              {
                sessionId: "session-attention",
                moduleId: "module-attention",
                moduleTitle: "Attention and RoPE",
                question: "Where should the causal mask be applied?",
                blocker: "The mask order is still unclear."
              }
            ]
          }
        })
      )
      .mockResolvedValueOnce(jsonResponse(review, 201));
    vi.stubGlobal("fetch", fetchMock);

    render(<ReviewWorkspace date="2026-10-09" />);

    expect(await screen.findByText("Close the loop")).toBeVisible();
    expect(screen.getByText("Learning outcomes")).toBeVisible();
    expect(screen.getByText("1 session")).toBeVisible();
    expect(screen.getByText("1 evidence item")).toBeVisible();
    expect(screen.getByText("1 knowledge card")).toBeVisible();
    expect(
      screen.getByText("Where should the causal mask be applied?")
    ).toBeVisible();
    expect(screen.getByText("The mask order is still unclear.")).toBeVisible();
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
