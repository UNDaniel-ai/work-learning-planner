import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AICoachEvent } from "../../../../domain/learning/types";
import { GET, POST } from "./route";

const mocks = vi.hoisted(() => {
  const allowedEvent: AICoachEvent = {
    id: "coach-allowed",
    sessionId: "session-attention",
    mode: "debug_guide",
    inputSummary: "Asked for a debugging strategy.",
    outputSummary: "Suggested inspecting logits around masking.",
    boundary: "allowed",
    createdAt: "2026-10-19T12:00:00.000Z"
  };
  const blockedEvent: AICoachEvent = {
    id: "coach-blocked",
    sessionId: "session-attention",
    mode: "direct_solution",
    inputSummary: "Asked for the completed assignment implementation.",
    outputSummary: "Direct solutions are outside the learning coach boundary.",
    boundary: "blocked",
    createdAt: "2026-10-19T12:00:00.000Z"
  };

  return {
    allowedEvent,
    blockedEvent,
    repository: {
      listCoachEventsForSession: vi.fn(async () => [allowedEvent, blockedEvent])
    },
    useCases: {
      recordCoachEvent: vi.fn(async (input: { mode: string }) =>
        input.mode === "direct_solution" ? blockedEvent : allowedEvent
      )
    }
  };
});

vi.mock("../../../../lib/learning/runtime", () => ({
  getLearningRuntime: vi.fn(async () => ({
    repository: mocks.repository,
    useCases: mocks.useCases
  }))
}));

describe("learning coach event API", () => {
  beforeEach(() => vi.clearAllMocks());

  it("records allowed coach modes and lists the session audit trail", async () => {
    const response = await POST(
      jsonRequest("http://localhost/api/learning/coach-events", {
        id: "coach-allowed",
        sessionId: "session-attention",
        mode: "debug_guide",
        requestedAction: "guidance",
        inputSummary: "Asked for a debugging strategy.",
        outputSummary: "Suggested inspecting logits around masking."
      })
    );

    expect(response.status).toBe(201);
    expect(mocks.useCases.recordCoachEvent).toHaveBeenCalledWith({
      id: "coach-allowed",
      sessionId: "session-attention",
      mode: "debug_guide",
      requestedAction: "guidance",
      inputSummary: "Asked for a debugging strategy.",
      outputSummary: "Suggested inspecting logits around masking."
    });
    await expect(
      (
        await GET(
          new Request(
            "http://localhost/api/learning/coach-events?sessionId=session-attention"
          )
        )
      ).json()
    ).resolves.toEqual({
      coachEvents: [mocks.allowedEvent, mocks.blockedEvent]
    });
  });

  it("returns 403 and an audit event for direct solutions", async () => {
    const response = await POST(
      jsonRequest("http://localhost/api/learning/coach-events", {
        id: "coach-blocked",
        sessionId: "session-attention",
        mode: "direct_solution",
        requestedAction: "guidance",
        inputSummary: "Asked for the completed assignment implementation."
      })
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      code: "COACH_BOUNDARY_BLOCKED",
      event: mocks.blockedEvent
    });
  });

  it("rejects assignment source code fields before persistence", async () => {
    const response = await POST(
      jsonRequest("http://localhost/api/learning/coach-events", {
        sessionId: "session-attention",
        mode: "code_review",
        requestedAction: "guidance",
        inputSummary: "Asked for a review of one concept.",
        outputSummary: "Suggested a shape check.",
        assignmentSource: "def attention(): assignment-source-code"
      })
    );

    expect(response.status).toBe(400);
    expect(mocks.useCases.recordCoachEvent).not.toHaveBeenCalled();
  });
});

function jsonRequest(url: string, body: unknown): Request {
  return new Request(url, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" }
  });
}
