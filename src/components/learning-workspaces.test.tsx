import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type {
  EvidenceItem,
  KnowledgeCard,
  LearningModule,
  LearningSource,
  LearningTrack,
  ReviewItem,
  StudySession
} from "../domain/learning/types";
import { KnowledgeCardWorkspace } from "./knowledge-card-workspace";
import { LearningTrackWorkspace } from "./learning-track-workspace";
import { LearningWorkspace } from "./learning-workspace";
import { StudySessionWorkspace } from "./study-session-workspace";

const source: LearningSource = {
  id: "source-cs336",
  title: "CS336 Assignment 1",
  kind: "repo",
  url: "https://github.com/stanford-cs336/assignment1-basics",
  revision: "a158843",
  aiGuidance: "coach_only",
  status: "active",
  createdAt: "2026-10-19T12:00:00.000Z",
  updatedAt: "2026-10-19T12:00:00.000Z"
};
const track: LearningTrack = {
  id: "track-cs336",
  sourceId: source.id,
  title: "CS336 Assignment 1 path",
  objective: "Implement and explain the assignment primitives.",
  status: "active",
  markdownPath: "learning/cs336-assignment1/track.md",
  createdAt: "2026-10-19T12:00:00.000Z",
  updatedAt: "2026-10-19T12:00:00.000Z"
};
const learningModule: LearningModule = {
  id: "module-attention",
  trackId: track.id,
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
  question: "Where should the causal mask be applied?",
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
const card: KnowledgeCard = {
  id: "card-attention",
  trackId: track.id,
  moduleId: learningModule.id,
  title: "Scaled dot-product attention",
  slug: "scaled-dot-product-attention",
  sourceIds: [source.id],
  evidenceIds: [evidence.id],
  relatedCardIds: [],
  maturity: "observed",
  confidence: 3,
  summary: "Attention scores are masked before softmax.",
  markdownPath:
    "learning/cs336-assignment1/knowledge/scaled-dot-product-attention.md",
  createdAt: "2026-10-19T14:00:00.000Z",
  updatedAt: "2026-10-19T14:00:00.000Z"
};
const reviewItem: ReviewItem = {
  id: "review-attention",
  knowledgeCardId: card.id,
  prompt: "Why is the mask applied before softmax?",
  nextReviewAt: "2026-10-20T12:00:00.000Z",
  ease: 3,
  reviewCount: 0,
  lapseCount: 0,
  status: "active"
};

const planningPeriod = {
  id: "period-1",
  type: "week" as const,
  startsOn: "2026-10-19",
  endsOn: "2026-10-25",
  focusGoalIds: [],
  taskLinkIds: []
};

afterEach(() => vi.unstubAllGlobals());

describe("learning workspaces", () => {
  it("loads learning indexes and creates a source and path", async () => {
    const createdSource = { ...source, id: "source-new", title: "New source" };
    const createdTrack = { ...track, id: "track-new", title: "New path" };
    const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      if (url === "/api/learning/sources" && init?.method === "POST") {
        return jsonResponse(createdSource, 201);
      }
      if (url === "/api/learning/tracks" && init?.method === "POST") {
        return jsonResponse({ track: createdTrack, modules: [learningModule] }, 201);
      }
      if (url === "/api/learning/sources") return jsonResponse({ sources: [source] });
      if (url === "/api/learning/tracks") return jsonResponse({ tracks: [track] });
      if (url.startsWith("/api/learning/reviews")) {
        return jsonResponse({ reviewItems: [reviewItem] });
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<LearningWorkspace />);

    expect(await screen.findByText("CS336 Assignment 1 path")).toBeVisible();
    expect(screen.getByText("Why is the mask applied before softmax?")).toBeVisible();

    fireEvent.change(screen.getByLabelText("Source title"), {
      target: { value: "New source" }
    });
    fireEvent.change(screen.getByLabelText("Source URL"), {
      target: { value: "https://example.com/course" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Add source" }));
    expect(await screen.findByText("New source")).toBeVisible();

    fireEvent.change(screen.getByLabelText("Path title"), {
      target: { value: "New path" }
    });
    fireEvent.change(screen.getByLabelText("Source slug"), {
      target: { value: "new-source" }
    });
    fireEvent.change(screen.getByLabelText("Learning objective"), {
      target: { value: "Finish one verified module." }
    });
    fireEvent.change(screen.getByLabelText("Initial module title"), {
      target: { value: "Foundations" }
    });
    fireEvent.change(screen.getByLabelText("Module slug"), {
      target: { value: "foundations" }
    });
    fireEvent.change(screen.getByLabelText("Expected outcome"), {
      target: { value: "Explain the foundations." }
    });
    fireEvent.change(screen.getByLabelText("Acceptance criterion"), {
      target: { value: "Pass a toy check." }
    });
    fireEvent.click(screen.getByRole("button", { name: "Create learning path" }));

    expect(await screen.findByText("New path")).toBeVisible();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/learning/tracks",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("shows a track and starts a focused study session", async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/track-cs336")) {
        return jsonResponse({ source, track, modules: [learningModule] });
      }
      if (url.startsWith("/api/learning/cards")) return jsonResponse({ cards: [card] });
      if (url === "/api/planning/weekly") {
        return jsonResponse({
          planningPeriods: [planningPeriod],
          timeBlocks: [],
          learningSessions: []
        });
      }
      if (url === "/api/learning/sessions" && init?.method === "POST") {
        return jsonResponse(
          { ...session, planningPeriodId: planningPeriod.id },
          201
        );
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<LearningTrackWorkspace trackId="track-cs336" />);

    expect((await screen.findAllByText("Attention and RoPE"))[0]).toBeVisible();
    expect(screen.getByText("coach only")).toBeVisible();
    fireEvent.change(screen.getByLabelText("Session slug"), {
      target: { value: "attention-mask" }
    });
    fireEvent.change(screen.getByLabelText("Study question"), {
      target: { value: session.question }
    });
    fireEvent.change(screen.getByLabelText("Current understanding"), {
      target: { value: session.preUnderstanding }
    });
    fireEvent.click(screen.getByRole("button", { name: "Start study session" }));

    expect(await screen.findByRole("link", { name: session.question })).toHaveAttribute(
      "href",
      `/learning/sessions/${session.id}`
    );
    expect(JSON.parse(fetchMock.mock.calls.at(-1)?.[1]?.body as string)).toMatchObject({
      planningPeriodId: planningPeriod.id
    });
  });

  it("adds evidence and promotes a session to a knowledge card", async () => {
    const newEvidence = {
      ...evidence,
      id: "evidence-shape",
      title: "Shape check",
      result: "fail" as const
    };
    const coachEvent = {
      id: "coach-attention",
      sessionId: session.id,
      mode: "debug_guide",
      inputSummary: "Asked for a debugging strategy.",
      outputSummary: "Suggested inspecting logits before and after masking.",
      boundary: "allowed",
      createdAt: "2026-10-19T14:00:00.000Z"
    } as const;
    const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/sessions/session-attention")) {
        return jsonResponse({
          module: learningModule,
          session,
          evidence: [evidence],
          coachEvents: []
        });
      }
      if (url.endsWith("/tracks/track-cs336")) {
        return jsonResponse({ source, track, modules: [learningModule] });
      }
      if (url.endsWith("/evidence") && init?.method === "POST") {
        return jsonResponse(newEvidence, 201);
      }
      if (url === "/api/learning/cards" && init?.method === "POST") {
        return jsonResponse({ card, reviewItem }, 201);
      }
      if (url === "/api/learning/coach-events" && init?.method === "POST") {
        return jsonResponse(coachEvent, 201);
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<StudySessionWorkspace sessionId="session-attention" />);

    expect(await screen.findByText("Two-token causal mask")).toBeVisible();
    expect(screen.getByText("Coach-only boundary")).toBeVisible();
    expect(
      screen.queryByRole("option", { name: "Direct solution" })
    ).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Coach mode"), {
      target: { value: "debug_guide" }
    });
    fireEvent.change(screen.getByLabelText("Coach request summary"), {
      target: { value: coachEvent.inputSummary }
    });
    fireEvent.change(screen.getByLabelText("Coach output summary"), {
      target: { value: coachEvent.outputSummary }
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Record coach interaction" })
    );
    expect(await screen.findByText(coachEvent.outputSummary)).toBeVisible();
    fireEvent.change(screen.getByLabelText("Evidence title"), {
      target: { value: "Shape check" }
    });
    fireEvent.change(screen.getByLabelText("Evidence slug"), {
      target: { value: "attention-shape-check" }
    });
    fireEvent.change(screen.getByLabelText("Evidence summary"), {
      target: { value: "Output shapes match." }
    });
    fireEvent.change(screen.getByLabelText("Evidence reference"), {
      target: { value: "tests/test_attention.py::test_shapes" }
    });
    fireEvent.change(screen.getByLabelText("Evidence result"), {
      target: { value: "fail" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Add evidence" }));
    expect(await screen.findByText("Shape check")).toBeVisible();
    expect(
      JSON.parse(
        fetchMock.mock.calls.find(
          ([url, init]) =>
            String(url).endsWith("/evidence") && init?.method === "POST"
        )?.[1]?.body as string
      )
    ).toMatchObject({ result: "fail" });

    fireEvent.change(screen.getByLabelText("Card title"), {
      target: { value: card.title }
    });
    fireEvent.change(screen.getByLabelText("Card slug"), {
      target: { value: card.slug }
    });
    fireEvent.change(screen.getByLabelText("Card summary"), {
      target: { value: card.summary }
    });
    fireEvent.change(screen.getByLabelText("Review prompt"), {
      target: { value: reviewItem.prompt }
    });
    fireEvent.click(screen.getByRole("button", { name: "Promote knowledge card" }));

    expect(await screen.findByRole("link", { name: card.title })).toHaveAttribute(
      "href",
      `/learning/cards/${card.id}`
    );
  });

  it("records active recall and advances card maturity", async () => {
    const reviewed = {
      ...reviewItem,
      lastAnswer: "Forbidden logits are removed before normalization.",
      reviewCount: 1,
      nextReviewAt: "2026-10-22T12:00:00.000Z"
    };
    const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/cards/card-attention") && init?.method === "PATCH") {
        return jsonResponse({ ...card, maturity: "understood" });
      }
      if (url.endsWith("/cards/card-attention")) {
        return jsonResponse({ card, evidence: [evidence], reviewItems: [reviewItem] });
      }
      if (url === "/api/learning/reviews" && init?.method === "POST") {
        return jsonResponse(reviewed);
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<KnowledgeCardWorkspace cardId="card-attention" />);

    expect(await screen.findByText(reviewItem.prompt)).toBeVisible();
    fireEvent.change(screen.getByLabelText("Recall answer"), {
      target: { value: reviewed.lastAnswer }
    });
    fireEvent.change(screen.getByLabelText("Recall score"), {
      target: { value: "4" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Save recall" }));
    expect(await screen.findByText(/Oct 22, 2026/)).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Advance to understood" }));
    expect(await screen.findByText("understood")).toBeVisible();
  });
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
