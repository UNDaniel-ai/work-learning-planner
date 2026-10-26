import { describe, expect, it, vi } from "vitest";
import type { LearningTopic } from "../planning/types";
import type {
  AICoachEvent,
  EvidenceItem,
  KnowledgeCard,
  LearningModule,
  LearningSource,
  LearningTrack,
  ReviewItem,
  StudySession
} from "./types";
import {
  createLearningUseCases,
  type LearningUseCaseRepository
} from "./use-cases";

describe("learning use cases", () => {
  it("creates a source, track, ordered modules, and Markdown indexes", async () => {
    const harness = createHarness();
    const source = await harness.useCases.createSource({
      id: "source-cs336",
      title: "  CS336 Assignment 1  ",
      kind: "repo",
      url: "https://github.com/stanford-cs336/assignment1-basics",
      repositoryUrl:
        "https://github.com/stanford-cs336/assignment1-basics",
      revision: "a158843",
      aiGuidance: "coach_only"
    });
    const result = await harness.useCases.createTrack({
      id: "track-cs336",
      sourceId: source.id,
      learningTopicId: "topic-cs336",
      sourceSlug: "cs336-assignment1",
      title: "CS336 Assignment 1 path",
      objective: "Implement and explain the assignment primitives.",
      modules: [
        {
          id: "module-attention",
          slug: "attention-and-rope",
          title: "Attention and RoPE",
          sequence: 5,
          expectedOutcome: "Explain causal masking and output shapes.",
          acceptanceCriteria: ["Pass a toy tensor check."]
        },
        {
          id: "module-environment",
          slug: "environment-and-tests",
          title: "Environment and tests",
          sequence: 1,
          expectedOutcome: "Explain the assignment test harness.",
          acceptanceCriteria: ["Describe the adapter boundary."]
        }
      ]
    });

    expect(source).toMatchObject({
      id: "source-cs336",
      title: "CS336 Assignment 1",
      status: "active",
      aiGuidance: "coach_only"
    });
    expect(result.track.markdownPath).toBe(
      "learning/cs336-assignment1/track.md"
    );
    expect(result.modules.map((learningModule) => learningModule.sequence)).toEqual([
      1,
      5
    ]);
    expect(result.modules.map((learningModule) => learningModule.markdownPath)).toEqual([
      "learning/cs336-assignment1/modules/01-environment-and-tests.md",
      "learning/cs336-assignment1/modules/05-attention-and-rope.md"
    ]);
    await expect(harness.useCases.getTrackDetails(result.track.id)).resolves.toEqual({
      source,
      track: result.track,
      modules: result.modules
    });
  });

  it("rejects missing dependencies before writing Markdown", async () => {
    const harness = createHarness();

    await expect(
      harness.useCases.createTrack({
        id: "track-missing-source",
        sourceId: "source-missing",
        sourceSlug: "missing-source",
        title: "Missing source",
        objective: "Should fail.",
        modules: []
      })
    ).rejects.toMatchObject({ code: "LEARNING_SOURCE_NOT_FOUND" });

    const source = await harness.useCases.createSource({
      id: "source-cs336",
      title: "CS336 Assignment 1",
      kind: "repo",
      url: "https://github.com/stanford-cs336/assignment1-basics",
      aiGuidance: "coach_only"
    });
    await expect(
      harness.useCases.createTrack({
        id: "track-missing-topic",
        sourceId: source.id,
        learningTopicId: "topic-missing",
        sourceSlug: "cs336-assignment1",
        title: "Missing topic",
        objective: "Should fail.",
        modules: []
      })
    ).rejects.toMatchObject({ code: "LEARNING_TOPIC_NOT_FOUND" });

    expect(harness.writer.writeTrack).not.toHaveBeenCalled();
    expect(harness.writer.writeModule).not.toHaveBeenCalled();
  });

  it("reports duplicate stable IDs before persistence errors leak", async () => {
    const harness = createHarness();
    const sourceInput = {
      id: "source-cs336",
      title: "CS336 Assignment 1",
      kind: "repo" as const,
      url: "https://github.com/stanford-cs336/assignment1-basics",
      aiGuidance: "coach_only" as const
    };

    await harness.useCases.createSource(sourceInput);
    await expect(harness.useCases.createSource(sourceInput)).rejects.toMatchObject({
      code: "DUPLICATE_LEARNING_ID"
    });
    await expect(
      harness.useCases.createTrack({
        id: "track-duplicate-modules",
        sourceId: sourceInput.id,
        sourceSlug: "cs336-assignment1",
        title: "Duplicate modules",
        objective: "Should fail.",
        modules: [
          {
            id: "module-same",
            slug: "first",
            title: "First",
            sequence: 1,
            expectedOutcome: "First outcome",
            acceptanceCriteria: ["First criterion"]
          },
          {
            id: "module-same",
            slug: "second",
            title: "Second",
            sequence: 2,
            expectedOutcome: "Second outcome",
            acceptanceCriteria: ["Second criterion"]
          }
        ]
      })
    ).rejects.toMatchObject({ code: "DUPLICATE_LEARNING_ID" });
  });

  it("runs a study session from a question to evidence-backed completion", async () => {
    const harness = createHarness();
    await seedLearningStructure(harness.useCases);

    const planned = await harness.useCases.createSession({
      id: "session-attention",
      moduleId: "module-attention",
      slug: "attention-mask",
      question: "Where should the causal mask be applied?",
      preUnderstanding: "Before softmax, I think."
    });
    const active = await harness.useCases.updateSession({
      id: planned.id,
      status: "active",
      attemptSummary: "Compare logits before and after masking."
    });
    const evidence = await harness.useCases.addEvidence({
      id: "evidence-mask",
      sessionId: active.id,
      slug: "attention-mask-toy-example",
      kind: "toy_example",
      title: "Two-token causal mask",
      summary: "The future token receives a masked logit.",
      reference: "tests/test_attention.py::test_causal_mask",
      result: "pass"
    });
    const completed = await harness.useCases.updateSession({
      id: active.id,
      status: "completed",
      outcome: "The mask must be applied before softmax."
    });

    expect(planned.markdownPath).toBe(
      "learning/cs336-assignment1/sessions/2026-10-19-attention-mask.md"
    );
    expect(active).toMatchObject({ status: "active", startedAt: expect.any(String) });
    expect(evidence.markdownPath).toBe(
      "learning/cs336-assignment1/experiments/attention-mask-toy-example.md"
    );
    expect(completed).toMatchObject({
      status: "completed",
      endedAt: expect.any(String),
      outcome: "The mask must be applied before softmax."
    });
    await expect(harness.useCases.getSessionDetails(planned.id)).resolves.toEqual({
      module: expect.objectContaining({ id: "module-attention" }),
      session: completed,
      evidence: [evidence],
      coachEvents: []
    });
    expect(harness.writer.updateSessionMetadata).toHaveBeenLastCalledWith({
      relativePath: planned.markdownPath,
      session: completed,
      evidenceIds: [evidence.id]
    });
  });

  it("requires evidence for completion and a blocker for blocked sessions", async () => {
    const harness = createHarness();
    await seedLearningStructure(harness.useCases);
    const session = await harness.useCases.createSession({
      id: "session-guarded",
      moduleId: "module-attention",
      slug: "guarded-session",
      question: "What does the mask prove?",
      preUnderstanding: "I need a small example."
    });
    await harness.useCases.updateSession({ id: session.id, status: "active" });

    await expect(
      harness.useCases.updateSession({
        id: session.id,
        status: "completed",
        outcome: "An unsupported conclusion."
      })
    ).rejects.toMatchObject({ code: "SESSION_EVIDENCE_REQUIRED" });
    await expect(
      harness.useCases.updateSession({ id: session.id, status: "blocked" })
    ).rejects.toMatchObject({ code: "SESSION_BLOCKER_REQUIRED" });
  });

  it("rejects sessions and evidence with missing parents", async () => {
    const harness = createHarness();

    await expect(
      harness.useCases.createSession({
        id: "session-missing-module",
        moduleId: "module-missing",
        slug: "missing-module",
        question: "Missing?",
        preUnderstanding: "Unknown."
      })
    ).rejects.toMatchObject({ code: "LEARNING_MODULE_NOT_FOUND" });
    await expect(
      harness.useCases.addEvidence({
        id: "evidence-missing-session",
        sessionId: "session-missing",
        slug: "missing-session",
        kind: "error",
        title: "Missing session",
        summary: "Should fail.",
        reference: "test-output",
        result: "fail"
      })
    ).rejects.toMatchObject({ code: "STUDY_SESSION_NOT_FOUND" });
  });

  it("promotes evidence into a card and advances its review queue", async () => {
    const harness = createHarness();
    const { session, evidence } = await seedCompletedSession(harness.useCases);

    const promoted = await harness.useCases.createKnowledgeCard({
      id: "card-attention",
      reviewItemId: "review-attention",
      sessionId: session.id,
      slug: "scaled-dot-product-attention",
      title: "Scaled dot-product attention",
      sourceIds: ["source-cs336"],
      evidenceIds: [evidence.id],
      summary: "Attention scores are masked before softmax.",
      confidence: 3,
      reviewPrompt: "Why is the causal mask applied before softmax?"
    });
    const understood = await harness.useCases.updateKnowledgeCard({
      id: promoted.card.id,
      maturity: "understood",
      confidence: 4
    });
    const reviewed = await harness.useCases.recordReview({
      id: promoted.reviewItem.id,
      answer: "Masking first makes forbidden positions receive zero probability.",
      ease: 4
    });

    expect(promoted.card).toMatchObject({
      moduleId: "module-attention",
      trackId: "track-cs336",
      evidenceIds: ["evidence-mask"],
      markdownPath:
        "learning/cs336-assignment1/knowledge/scaled-dot-product-attention.md"
    });
    expect(promoted.reviewItem.nextReviewAt).toBe(
      "2026-10-20T12:00:00.000Z"
    );
    expect(understood).toMatchObject({ maturity: "understood", confidence: 4 });
    expect(reviewed).toMatchObject({
      lastAnswer:
        "Masking first makes forbidden positions receive zero probability.",
      ease: 4,
      reviewCount: 1,
      lapseCount: 0,
      nextReviewAt: "2026-10-22T12:00:00.000Z"
    });
    await expect(
      harness.useCases.getKnowledgeCardDetails(promoted.card.id)
    ).resolves.toEqual({
      card: understood,
      evidence: [evidence],
      reviewItems: [reviewed]
    });
  });

  it("rejects cards without session-owned evidence and maturity skips", async () => {
    const harness = createHarness();
    const { session } = await seedCompletedSession(harness.useCases);

    await expect(
      harness.useCases.createKnowledgeCard({
        id: "card-no-evidence",
        reviewItemId: "review-no-evidence",
        sessionId: session.id,
        slug: "no-evidence",
        title: "No evidence",
        sourceIds: ["source-cs336"],
        evidenceIds: ["evidence-missing"],
        summary: "Should fail.",
        confidence: 3,
        reviewPrompt: "What supports this?"
      })
    ).rejects.toMatchObject({ code: "CARD_EVIDENCE_INVALID" });

    const promoted = await harness.useCases.createKnowledgeCard({
      id: "card-guarded",
      reviewItemId: "review-guarded",
      sessionId: session.id,
      slug: "guarded-card",
      title: "Guarded card",
      sourceIds: ["source-cs336"],
      evidenceIds: ["evidence-mask"],
      summary: "A supported card.",
      confidence: 3,
      reviewPrompt: "Recall it."
    });
    await expect(
      harness.useCases.updateKnowledgeCard({
        id: promoted.card.id,
        maturity: "verified"
      })
    ).rejects.toThrow(/maturity/i);
  });

  it("records allowed coaching and audits blocked assignment actions", async () => {
    const harness = createHarness();
    await seedLearningStructure(harness.useCases);
    const session = await harness.useCases.createSession({
      id: "session-coach",
      moduleId: "module-attention",
      slug: "coach-boundary",
      question: "How can I inspect the mask placement?",
      preUnderstanding: "I should compare logits around masking."
    });

    const allowed = await harness.useCases.recordCoachEvent({
      id: "coach-allowed",
      sessionId: session.id,
      mode: "debug_guide",
      requestedAction: "guidance",
      inputSummary: "Asked for a debugging strategy.",
      outputSummary: "Suggested inspecting logits before and after masking."
    });
    const directSolution = await harness.useCases.recordCoachEvent({
      id: "coach-direct",
      sessionId: session.id,
      mode: "direct_solution",
      requestedAction: "guidance",
      inputSummary: "Asked for the completed attention implementation."
    });
    const todoCompletion = await harness.useCases.recordCoachEvent({
      id: "coach-todo",
      sessionId: session.id,
      mode: "concept_hint",
      requestedAction: "todo_completion",
      inputSummary: "Asked to complete the attention TODO.",
      outputSummary: "This caller-provided text must not be persisted."
    });

    expect(allowed).toMatchObject({ boundary: "allowed" });
    expect(directSolution).toMatchObject({
      boundary: "blocked",
      outputSummary: expect.stringMatching(/direct solution/i)
    });
    expect(todoCompletion).toMatchObject({
      boundary: "blocked",
      outputSummary: expect.stringMatching(/TODO/i)
    });
    expect(JSON.stringify(todoCompletion)).not.toContain(
      "caller-provided text"
    );
    await expect(
      harness.useCases.getSessionDetails(session.id)
    ).resolves.toMatchObject({
      coachEvents: [allowed, directSolution, todoCompletion]
    });
  });

  it("derives the source slug from a custom learning assets directory", async () => {
    const harness = createHarness("temp/e2e-learning-assets");
    await seedLearningStructure(harness.useCases);

    await expect(
      harness.useCases.createSession({
        id: "session-custom-assets",
        moduleId: "module-attention",
        slug: "custom-assets",
        question: "Can the isolated asset root create a session?",
        preUnderstanding: "The source slug should come from the track parent."
      })
    ).resolves.toMatchObject({
      markdownPath:
        "temp/e2e-learning-assets/cs336-assignment1/sessions/2026-10-19-custom-assets.md"
    });
  });
});

function createHarness(assetPrefix = "learning") {
  const sources = new Map<string, LearningSource>();
  const tracks = new Map<string, LearningTrack>();
  const modules = new Map<string, LearningModule>();
  const sessions = new Map<string, StudySession>();
  const evidenceItems = new Map<string, EvidenceItem>();
  const cards = new Map<string, KnowledgeCard>();
  const reviewItems = new Map<string, ReviewItem>();
  const coachEvents = new Map<string, AICoachEvent>();
  const topic: LearningTopic = {
    id: "topic-cs336",
    areaId: "area-learning",
    title: "CS336",
    progressPercent: 0,
    status: "active",
    createdAt: "2026-10-19T12:00:00.000Z"
  };
  const repository: LearningUseCaseRepository = {
    createSource: async (source) => {
      sources.set(source.id, source);
    },
    getSource: async (sourceId) => sources.get(sourceId),
    createTrack: async (track) => {
      tracks.set(track.id, track);
    },
    getTrack: async (trackId) => tracks.get(trackId),
    createModule: async (learningModule) => {
      modules.set(learningModule.id, learningModule);
    },
    getModule: async (moduleId) => modules.get(moduleId),
    listModulesForTrack: async (trackId) =>
      [...modules.values()]
        .filter((learningModule) => learningModule.trackId === trackId)
        .sort((left, right) => left.sequence - right.sequence),
    createSession: async (session) => {
      sessions.set(session.id, session);
    },
    updateSession: async (session) => {
      sessions.set(session.id, session);
    },
    getSession: async (sessionId) => sessions.get(sessionId),
    createEvidence: async (evidence) => {
      evidenceItems.set(evidence.id, evidence);
    },
    getEvidence: async (evidenceId) => evidenceItems.get(evidenceId),
    listEvidenceForSession: async (sessionId) =>
      [...evidenceItems.values()].filter(
        (evidence) => evidence.sessionId === sessionId
      ),
    createKnowledgeCard: async (card) => {
      cards.set(card.id, card);
    },
    updateKnowledgeCard: async (card) => {
      cards.set(card.id, card);
    },
    getKnowledgeCard: async (cardId) => cards.get(cardId),
    createReviewItem: async (reviewItem) => {
      reviewItems.set(reviewItem.id, reviewItem);
    },
    updateReviewItem: async (reviewItem) => {
      reviewItems.set(reviewItem.id, reviewItem);
    },
    getReviewItem: async (reviewItemId) => reviewItems.get(reviewItemId),
    listReviewItemsForCard: async (cardId) =>
      [...reviewItems.values()].filter(
        (reviewItem) => reviewItem.knowledgeCardId === cardId
      ),
    createCoachEvent: async (event) => {
      coachEvents.set(event.id, event);
    },
    getCoachEvent: async (eventId) => coachEvents.get(eventId),
    listCoachEventsForSession: async (sessionId) =>
      [...coachEvents.values()].filter((event) => event.sessionId === sessionId)
  };
  const writer = {
    writeTrack: vi.fn(async ({ sourceSlug }: { sourceSlug: string }) => ({
      relativePath: `${assetPrefix}/${sourceSlug}/track.md`,
      created: true
    })),
    writeModule: vi.fn(
      async ({
        sourceSlug,
        slug,
        learningModule
      }: {
        sourceSlug: string;
        slug: string;
        learningModule: LearningModule;
      }) => ({
        relativePath: `${assetPrefix}/${sourceSlug}/modules/${String(
          learningModule.sequence
        ).padStart(2, "0")}-${slug}.md`,
        created: true
      })
    ),
    writeSession: vi.fn(
      async ({ sourceSlug, slug }: { sourceSlug: string; slug: string }) => ({
        relativePath: `${assetPrefix}/${sourceSlug}/sessions/2026-10-19-${slug}.md`,
        created: true
      })
    ),
    writeEvidence: vi.fn(
      async ({ sourceSlug, slug }: { sourceSlug: string; slug: string }) => ({
        relativePath: `${assetPrefix}/${sourceSlug}/experiments/${slug}.md`,
        created: true
      })
    ),
    updateSessionMetadata: vi.fn(async () => undefined)
    ,
    writeKnowledgeCard: vi.fn(
      async ({ sourceSlug, card }: { sourceSlug: string; card: KnowledgeCard }) => ({
        relativePath: `${assetPrefix}/${sourceSlug}/knowledge/${card.slug}.md`,
        created: true
      })
    ),
    updateKnowledgeCardMetadata: vi.fn(async () => undefined)
  };

  return {
    writer,
    useCases: createLearningUseCases({
      repository,
      planningRepository: {
        listLearningTopics: async () => [topic]
      },
      writer,
      now: () => "2026-10-19T12:00:00.000Z"
    })
  };
}

async function seedCompletedSession(
  useCases: ReturnType<typeof createHarness>["useCases"]
) {
  await seedLearningStructure(useCases);
  const planned = await useCases.createSession({
    id: "session-attention",
    moduleId: "module-attention",
    slug: "attention-mask",
    question: "Where should the causal mask be applied?",
    preUnderstanding: "Before softmax, I think."
  });
  const active = await useCases.updateSession({ id: planned.id, status: "active" });
  const evidence = await useCases.addEvidence({
    id: "evidence-mask",
    sessionId: active.id,
    slug: "attention-mask-toy-example",
    kind: "toy_example",
    title: "Two-token causal mask",
    summary: "The future token receives a masked logit.",
    reference: "tests/test_attention.py::test_causal_mask",
    result: "pass"
  });
  const session = await useCases.updateSession({
    id: active.id,
    status: "completed",
    outcome: "The mask is applied before softmax."
  });

  return { session, evidence };
}

async function seedLearningStructure(
  useCases: ReturnType<typeof createHarness>["useCases"]
): Promise<void> {
  await useCases.createSource({
    id: "source-cs336",
    title: "CS336 Assignment 1",
    kind: "repo",
    url: "https://github.com/stanford-cs336/assignment1-basics",
    aiGuidance: "coach_only"
  });
  await useCases.createTrack({
    id: "track-cs336",
    sourceId: "source-cs336",
    sourceSlug: "cs336-assignment1",
    title: "CS336 Assignment 1 path",
    objective: "Implement and explain the assignment primitives.",
    modules: [
      {
        id: "module-attention",
        slug: "attention-and-rope",
        title: "Attention and RoPE",
        sequence: 5,
        expectedOutcome: "Explain masking and output shapes.",
        acceptanceCriteria: ["Pass a toy tensor check."]
      }
    ]
  });
}
