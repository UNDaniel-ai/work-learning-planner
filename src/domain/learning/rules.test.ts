import { describe, expect, it } from "vitest";
import {
  calculateNextReviewAt,
  createEvidenceItem,
  createKnowledgeCard,
  createLearningModule,
  createLearningSource,
  createLearningTrack,
  createStudySession,
  getCoachBoundaryDecision,
  isCoachModeAllowed,
  transitionKnowledgeCardMaturity,
  transitionStudySession
} from "./rules";

describe("learning domain rules", () => {
  it("creates a source with a normalized title and valid URL", () => {
    const source = createLearningSource({
      id: "source-cs336",
      title: "  CS336 Assignment 1  ",
      kind: "repo",
      url: "https://github.com/stanford-cs336/assignment1-basics",
      revision: "a158843",
      aiGuidance: "coach_only",
      createdAt: "2026-10-19T12:00:00.000Z",
      updatedAt: "2026-10-19T12:00:00.000Z"
    });

    expect(source).toMatchObject({
      id: "source-cs336",
      title: "CS336 Assignment 1",
      kind: "repo",
      revision: "a158843",
      status: "active"
    });
  });

  it("rejects invalid source URLs and blank titles", () => {
    expect(() =>
      createLearningSource({
        id: "source-invalid",
        title: " ",
        kind: "article",
        url: "ftp://example.com/course",
        aiGuidance: "open",
        createdAt: "2026-10-19T12:00:00.000Z",
        updatedAt: "2026-10-19T12:00:00.000Z"
      })
    ).toThrow(/title/i);

    expect(() =>
      createLearningSource({
        id: "source-invalid-url",
        title: "A source",
        kind: "article",
        url: "not-a-url",
        aiGuidance: "open",
        createdAt: "2026-10-19T12:00:00.000Z",
        updatedAt: "2026-10-19T12:00:00.000Z"
      })
    ).toThrow(/url/i);
  });

  it("creates tracks and ordered modules with bounded fields", () => {
    const track = createLearningTrack({
      id: "track-cs336",
      sourceId: "source-cs336",
      learningTopicId: "topic-cs336",
      title: "CS336 Assignment 1 path",
      objective: "Implement and explain the assignment primitives.",
      createdAt: "2026-10-19T12:00:00.000Z",
      updatedAt: "2026-10-19T12:00:00.000Z"
    });
    const learningModule = createLearningModule({
      id: "module-attention",
      trackId: track.id,
      title: "Attention and RoPE",
      sequence: 5,
      expectedOutcome: "Explain causal masking and output shapes.",
      acceptanceCriteria: ["Pass a toy tensor check.", "Explain the mask boundary."],
      createdAt: "2026-10-19T12:00:00.000Z",
      updatedAt: "2026-10-19T12:00:00.000Z"
    });

    expect(track.status).toBe("active");
    expect(learningModule).toMatchObject({
      id: "module-attention",
      sequence: 5,
      status: "not_started"
    });

    expect(() =>
      createLearningModule({
        id: "module-invalid",
        trackId: track.id,
        title: "Invalid",
        sequence: 0,
        expectedOutcome: "Outcome",
        acceptanceCriteria: ["Criterion"],
        createdAt: "2026-10-19T12:00:00.000Z",
        updatedAt: "2026-10-19T12:00:00.000Z"
      })
    ).toThrow(/sequence/i);
  });

  it("allows deliberate study session transitions and rejects skipped states", () => {
    const session = createStudySession({
      id: "session-1",
      moduleId: "module-attention",
      question: "Where should the causal mask be applied?",
      preUnderstanding: "I think it must affect the logits before softmax.",
      createdAt: "2026-10-19T12:00:00.000Z",
      updatedAt: "2026-10-19T12:00:00.000Z"
    });

    expect(session.status).toBe("planned");
    expect(transitionStudySession(session, "active").status).toBe("active");
    expect(
      transitionStudySession(
        transitionStudySession(session, "active"),
        "completed"
      ).status
    ).toBe("completed");

    expect(() => transitionStudySession(session, "completed")).toThrow(
      /transition/i
    );
  });

  it("requires a reference when recording evidence", () => {
    const evidence = createEvidenceItem({
      id: "evidence-1",
      sessionId: "session-1",
      kind: "toy_example",
      title: "Two-token causal mask",
      summary: "The future token receives a masked logit.",
      reference: "attention-mask-toy-example.md",
      result: "pass",
      createdAt: "2026-10-19T12:30:00.000Z"
    });

    expect(evidence.result).toBe("pass");
    expect(() =>
      createEvidenceItem({
        id: "evidence-invalid",
        sessionId: "session-1",
        kind: "error",
        title: "A failure",
        summary: "The shape was wrong.",
        reference: " ",
        result: "fail",
        createdAt: "2026-10-19T12:30:00.000Z"
      })
    ).toThrow(/reference/i);
  });

  it("requires evidence before creating a knowledge card", () => {
    const card = createKnowledgeCard({
      id: "card-attention",
      trackId: "track-cs336",
      moduleId: "module-attention",
      title: "Scaled dot-product attention",
      slug: "scaled-dot-product-attention",
      sourceIds: ["source-cs336"],
      evidenceIds: ["evidence-1"],
      summary: "Attention scores are scaled before the mask and softmax.",
      confidence: 3,
      createdAt: "2026-10-19T13:00:00.000Z",
      updatedAt: "2026-10-19T13:00:00.000Z"
    });

    expect(card).toMatchObject({
      maturity: "observed",
      confidence: 3,
      evidenceIds: ["evidence-1"]
    });

    expect(() =>
      createKnowledgeCard({
        id: "card-invalid",
        trackId: "track-cs336",
        moduleId: "module-attention",
        title: "No evidence",
        slug: "no-evidence",
        sourceIds: ["source-cs336"],
        evidenceIds: [],
        summary: "This should remain a note, not a card.",
        confidence: 3,
        createdAt: "2026-10-19T13:00:00.000Z",
        updatedAt: "2026-10-19T13:00:00.000Z"
      })
    ).toThrow(/evidence/i);
  });

  it("allows knowledge maturity to advance one verified step at a time", () => {
    const card = createKnowledgeCard({
      id: "card-maturity",
      trackId: "track-cs336",
      moduleId: "module-attention",
      title: "Attention masks",
      slug: "attention-masks",
      sourceIds: ["source-cs336"],
      evidenceIds: ["evidence-1"],
      summary: "Masks remove future positions before softmax.",
      confidence: 3,
      createdAt: "2026-10-19T13:00:00.000Z",
      updatedAt: "2026-10-19T13:00:00.000Z"
    });

    expect(
      transitionKnowledgeCardMaturity(
        card,
        "understood",
        "2026-10-19T14:00:00.000Z"
      )
    ).toMatchObject({
      maturity: "understood",
      updatedAt: "2026-10-19T14:00:00.000Z"
    });
    expect(() =>
      transitionKnowledgeCardMaturity(card, "verified")
    ).toThrow(/maturity/i);
  });

  it("calculates simple spaced-review intervals", () => {
    expect(
      calculateNextReviewAt({
        now: "2026-10-19T12:00:00.000Z",
        ease: 3,
        reviewCount: 0,
        lapseCount: 0
      })
    ).toBe("2026-10-20T12:00:00.000Z");

    expect(
      calculateNextReviewAt({
        now: "2026-10-19T12:00:00.000Z",
        ease: 4,
        reviewCount: 1,
        lapseCount: 0
      })
    ).toBe("2026-10-22T12:00:00.000Z");

    expect(
      calculateNextReviewAt({
        now: "2026-10-19T12:00:00.000Z",
        ease: 5,
        reviewCount: 2,
        lapseCount: 0
      })
    ).toBe("2026-10-26T12:00:00.000Z");

    expect(
      calculateNextReviewAt({
        now: "2026-10-19T12:00:00.000Z",
        ease: 5,
        reviewCount: 3,
        lapseCount: 0
      })
    ).toBe("2026-11-02T12:00:00.000Z");

    expect(
      calculateNextReviewAt({
        now: "2026-10-19T12:00:00.000Z",
        ease: 2,
        reviewCount: 4,
        lapseCount: 1
      })
    ).toBe("2026-10-20T12:00:00.000Z");
  });

  it("blocks direct solutions for coach-only sources", () => {
    expect(isCoachModeAllowed("debug_guide", "coach_only")).toBe(true);
    expect(isCoachModeAllowed("direct_solution", "coach_only")).toBe(false);
    expect(isCoachModeAllowed("concept_hint", "restricted")).toBe(false);
    expect(isCoachModeAllowed("socratic", "open")).toBe(true);
  });

  it("blocks assignment completion and execution actions", () => {
    expect(
      getCoachBoundaryDecision({
        mode: "debug_guide",
        aiGuidance: "coach_only",
        requestedAction: "guidance"
      })
    ).toEqual({ boundary: "allowed" });
    expect(
      getCoachBoundaryDecision({
        mode: "concept_hint",
        aiGuidance: "coach_only",
        requestedAction: "todo_completion"
      })
    ).toMatchObject({ boundary: "blocked", reason: expect.stringMatching(/TODO/i) });
    expect(
      getCoachBoundaryDecision({
        mode: "code_review",
        aiGuidance: "open",
        requestedAction: "edit_assignment"
      })
    ).toMatchObject({ boundary: "blocked", reason: expect.stringMatching(/edit/i) });
    expect(
      getCoachBoundaryDecision({
        mode: "debug_guide",
        aiGuidance: "open",
        requestedAction: "run_assignment_command"
      })
    ).toMatchObject({ boundary: "blocked", reason: expect.stringMatching(/command/i) });
  });
});
