import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  EvidenceItem,
  LearningModule,
  StudySession
} from "../../../domain/learning/types";
import { LearningUseCaseError } from "../../../domain/learning/use-cases";
import {
  GET as getSessions,
  POST as postSession
} from "./sessions/route";
import {
  GET as getSession,
  PATCH as patchSession
} from "./sessions/[sessionId]/route";
import {
  GET as getEvidence,
  POST as postEvidence
} from "./sessions/[sessionId]/evidence/route";

const mocks = vi.hoisted(() => {
  const learningModule: LearningModule = {
    id: "module-attention",
    trackId: "track-cs336",
    title: "Attention and RoPE",
    sequence: 5,
    status: "active",
    expectedOutcome: "Explain masking and output shapes.",
    acceptanceCriteria: ["Pass a toy tensor check."],
    markdownPath: "learning/cs336-assignment1/modules/05-attention-and-rope.md",
    createdAt: "2026-10-19T12:00:00.000Z",
    updatedAt: "2026-10-19T12:00:00.000Z"
  };
  const session: StudySession = {
    id: "session-attention",
    moduleId: learningModule.id,
    status: "active",
    question: "Where should the mask be applied?",
    preUnderstanding: "Before softmax, I think.",
    markdownPath: "learning/cs336-assignment1/sessions/2026-10-19-attention-mask.md",
    createdAt: "2026-10-19T13:00:00.000Z",
    updatedAt: "2026-10-19T13:00:00.000Z"
  };
  const evidence: EvidenceItem = {
    id: "evidence-mask",
    sessionId: session.id,
    kind: "toy_example",
    title: "Two-token causal mask",
    summary: "The future token receives a masked logit.",
    reference: "tests/test_attention.py::test_causal_mask",
    result: "pass",
    createdAt: "2026-10-19T13:30:00.000Z"
  };

  return {
    learningModule,
    session,
    evidence,
    repository: {
      listSessions: vi.fn(async () => [session]),
      listSessionsForModule: vi.fn(async () => [session]),
      listEvidenceForSession: vi.fn(async () => [evidence])
    },
    useCases: {
      createSession: vi.fn(async () => session),
      updateSession: vi.fn(async () => session),
      addEvidence: vi.fn(async () => evidence),
      getSessionDetails: vi.fn(async () => ({
        module: learningModule,
        session,
        evidence: [evidence]
      }))
    }
  };
});

vi.mock("../../../lib/learning/runtime", () => ({
  getLearningRuntime: vi.fn(async () => ({
    repository: mocks.repository,
    useCases: mocks.useCases
  }))
}));

describe("learning session and evidence API routes", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates and filters study sessions", async () => {
    const response = await postSession(
      jsonRequest("http://localhost/api/learning/sessions", {
        id: "session-attention",
        moduleId: "module-attention",
        slug: "attention-mask",
        question: "Where should the mask be applied?",
        preUnderstanding: "Before softmax, I think."
      })
    );

    expect(response.status).toBe(201);
    expect(mocks.useCases.createSession).toHaveBeenCalledWith({
      id: "session-attention",
      moduleId: "module-attention",
      slug: "attention-mask",
      question: "Where should the mask be applied?",
      preUnderstanding: "Before softmax, I think."
    });
    const listResponse = await getSessions(
      new Request(
        "http://localhost/api/learning/sessions?moduleId=module-attention"
      )
    );
    await expect(listResponse.json()).resolves.toEqual({ sessions: [mocks.session] });
    expect(mocks.repository.listSessionsForModule).toHaveBeenCalledWith(
      "module-attention"
    );
  });

  it("loads and transitions a study session", async () => {
    const context = { params: Promise.resolve({ sessionId: "session-attention" }) };
    const getResponse = await getSession(
      new Request("http://localhost/api/learning/sessions/session-attention"),
      context
    );
    const patchResponse = await patchSession(
      jsonRequest("http://localhost/api/learning/sessions/session-attention", {
        status: "completed",
        outcome: "The mask is applied before softmax."
      }),
      context
    );

    expect(getResponse.status).toBe(200);
    expect(patchResponse.status).toBe(200);
    expect(mocks.useCases.updateSession).toHaveBeenCalledWith({
      id: "session-attention",
      status: "completed",
      outcome: "The mask is applied before softmax."
    });
  });

  it("adds and lists evidence under its session", async () => {
    const context = { params: Promise.resolve({ sessionId: "session-attention" }) };
    const response = await postEvidence(
      jsonRequest(
        "http://localhost/api/learning/sessions/session-attention/evidence",
        {
          id: "evidence-mask",
          slug: "attention-mask-toy-example",
          kind: "toy_example",
          title: "Two-token causal mask",
          summary: "The future token receives a masked logit.",
          reference: "tests/test_attention.py::test_causal_mask",
          result: "pass"
        }
      ),
      context
    );

    expect(response.status).toBe(201);
    expect(mocks.useCases.addEvidence).toHaveBeenCalledWith({
      id: "evidence-mask",
      sessionId: "session-attention",
      slug: "attention-mask-toy-example",
      kind: "toy_example",
      title: "Two-token causal mask",
      summary: "The future token receives a masked logit.",
      reference: "tests/test_attention.py::test_causal_mask",
      result: "pass"
    });
    await expect(
      (
        await getEvidence(
          new Request(
            "http://localhost/api/learning/sessions/session-attention/evidence"
          ),
          context
        )
      ).json()
    ).resolves.toEqual({ evidence: [mocks.evidence] });
  });

  it("returns 422 when completion has no evidence", async () => {
    mocks.useCases.updateSession.mockRejectedValueOnce(
      new LearningUseCaseError(
        "SESSION_EVIDENCE_REQUIRED",
        "A completed study session requires evidence."
      )
    );
    const response = await patchSession(
      jsonRequest("http://localhost/api/learning/sessions/session-attention", {
        status: "completed",
        outcome: "Unsupported."
      }),
      { params: Promise.resolve({ sessionId: "session-attention" }) }
    );

    expect(response.status).toBe(422);
  });
});

function jsonRequest(url: string, body: unknown): Request {
  return new Request(url, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" }
  });
}
