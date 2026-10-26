import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import type {
  AICoachEvent,
  EvidenceItem,
  KnowledgeCard,
  LearningModule,
  LearningSource,
  LearningTrack,
  ReviewItem,
  StudySession
} from "../../domain/learning/types";
import {
  createPlannerDatabase,
  migratePlannerDatabase,
  type PlannerDatabaseConnection
} from "./client";
import { createLearningRepository } from "./learning-repositories";
import { createPlanningRepository } from "./repositories";

type TestDatabase = {
  connection: PlannerDatabaseConnection;
  path: string;
};

const testDatabases: TestDatabase[] = [];

afterEach(async () => {
  for (const testDatabase of testDatabases.splice(0)) {
    testDatabase.connection.close();
    await rm(testDatabase.path, { force: true });
  }
});

describe("learning repository", () => {
  it("persists the learning graph with stable filtered ordering", async () => {
    const repository = await createTestRepository();
    const records = createLearningRecords();
    const laterModule: LearningModule = {
      ...records.learningModule,
      id: "module-transformer",
      title: "Transformer forward",
      sequence: 6
    };
    const laterSession: StudySession = {
      ...records.studySession,
      id: "session-later",
      createdAt: "2026-10-19T14:00:00.000Z",
      updatedAt: "2026-10-19T14:00:00.000Z"
    };
    const laterEvidence: EvidenceItem = {
      ...records.evidenceItem,
      id: "evidence-later",
      title: "Shape check",
      createdAt: "2026-10-19T14:30:00.000Z"
    };
    const laterCoachEvent: AICoachEvent = {
      ...records.aiCoachEvent,
      id: "coach-later",
      createdAt: "2026-10-19T15:00:00.000Z"
    };

    await repository.createSource(records.learningSource);
    await repository.createTrack(records.learningTrack);
    await repository.createModule(laterModule);
    await repository.createModule(records.learningModule);
    await repository.createSession(laterSession);
    await repository.createSession(records.studySession);
    await repository.createEvidence(laterEvidence);
    await repository.createEvidence(records.evidenceItem);
    await repository.createKnowledgeCard(records.knowledgeCard);
    await repository.createReviewItem(records.reviewItem);
    await repository.createCoachEvent(laterCoachEvent);
    await repository.createCoachEvent(records.aiCoachEvent);

    await expect(repository.getSource(records.learningSource.id)).resolves.toEqual(
      records.learningSource
    );
    await expect(repository.getSource("missing-source")).resolves.toBeUndefined();
    await expect(
      repository.listModulesForTrack(records.learningTrack.id)
    ).resolves.toEqual([records.learningModule, laterModule]);
    await expect(
      repository.listSessionsForModule(records.learningModule.id)
    ).resolves.toEqual([records.studySession, laterSession]);
    await expect(
      repository.listEvidenceForSession(records.studySession.id)
    ).resolves.toEqual([records.evidenceItem, laterEvidence]);
    await expect(
      repository.listKnowledgeCardsForTrack(records.learningTrack.id)
    ).resolves.toEqual([records.knowledgeCard]);
    await expect(
      repository.listReviewQueue("2026-10-20T12:00:00.000Z")
    ).resolves.toEqual([records.reviewItem]);
    await expect(
      repository.listCoachEventsForSession(records.studySession.id)
    ).resolves.toEqual([records.aiCoachEvent, laterCoachEvent]);
  });

  it("updates mutable learning state without losing optional fields", async () => {
    const repository = await createTestRepository();
    const records = createLearningRecords();

    await repository.createSource(records.learningSource);
    await repository.createTrack(records.learningTrack);
    await repository.createModule(records.learningModule);
    await repository.createSession(records.studySession);
    await repository.createEvidence(records.evidenceItem);
    await repository.createKnowledgeCard(records.knowledgeCard);
    await repository.createReviewItem(records.reviewItem);

    const completedSession: StudySession = {
      ...records.studySession,
      status: "completed",
      endedAt: "2026-10-19T14:00:00.000Z",
      attemptSummary: "Checked a two-token example.",
      outcome: "The mask must be applied before softmax.",
      updatedAt: "2026-10-19T14:00:00.000Z"
    };
    const verifiedCard: KnowledgeCard = {
      ...records.knowledgeCard,
      maturity: "verified",
      confidence: 4,
      updatedAt: "2026-10-19T14:10:00.000Z"
    };
    const reviewedItem: ReviewItem = {
      ...records.reviewItem,
      lastAnswer: "Forbidden positions should receive zero probability.",
      lastErrorType: "mask-after-softmax",
      lastReviewedAt: "2026-10-20T12:00:00.000Z",
      nextReviewAt: "2026-10-23T12:00:00.000Z",
      ease: 4,
      reviewCount: 1
    };

    await repository.updateSession(completedSession);
    await repository.updateKnowledgeCard(verifiedCard);
    await repository.updateReviewItem(reviewedItem);

    await expect(repository.getSession(completedSession.id)).resolves.toEqual(
      completedSession
    );
    await expect(
      repository.getKnowledgeCard(verifiedCard.id)
    ).resolves.toEqual(verifiedCard);
    await expect(repository.getReviewItem(reviewedItem.id)).resolves.toEqual(
      reviewedItem
    );
  });

  it("aggregates linked sessions and learning outputs for planning views", async () => {
    const { learningRepository, planningRepository } =
      await createTestRepositories();
    const records = createLearningRecords();
    const linkedSession: StudySession = {
      ...records.studySession,
      planningPeriodId: "period-week",
      timeBlockId: "block-attention"
    };
    const blockedSession: StudySession = {
      ...records.studySession,
      id: "session-rope",
      planningPeriodId: "period-week",
      timeBlockId: undefined,
      status: "blocked",
      question: "Why are frequencies paired across dimensions?",
      blocker: "The rotation layout is still unclear.",
      createdAt: "2026-10-20T09:00:00.000Z",
      updatedAt: "2026-10-20T09:30:00.000Z"
    };

    await planningRepository.createArea({
      id: "area-learning",
      name: "Learning",
      kind: "learning"
    });
    await planningRepository.createPlanningPeriod({
      id: "period-week",
      type: "week",
      startsOn: "2026-10-19",
      endsOn: "2026-10-25",
      focusGoalIds: [],
      taskLinkIds: []
    });
    await planningRepository.createTimeBlock({
      id: "block-attention",
      periodId: "period-week",
      areaId: "area-learning",
      startsAt: "2026-10-19T13:00:00.000Z",
      endsAt: "2026-10-19T14:00:00.000Z",
      durationMinutes: 60
    });
    await learningRepository.createSource(records.learningSource);
    await learningRepository.createTrack(records.learningTrack);
    await learningRepository.createModule(records.learningModule);
    await learningRepository.createSession(linkedSession);
    await learningRepository.createSession(blockedSession);
    await learningRepository.createEvidence(records.evidenceItem);
    await learningRepository.createKnowledgeCard(records.knowledgeCard);

    await expect(
      learningRepository.listSessionSummaries({
        timeBlockIds: ["block-attention"]
      })
    ).resolves.toEqual([
      { session: linkedSession, module: records.learningModule }
    ]);
    await expect(
      learningRepository.getPeriodLearningSummary("period-week")
    ).resolves.toEqual({
      sessions: [
        { session: linkedSession, module: records.learningModule },
        { session: blockedSession, module: records.learningModule }
      ],
      evidence: [records.evidenceItem],
      knowledgeCards: [records.knowledgeCard],
      blockedQuestions: [
        {
          sessionId: blockedSession.id,
          moduleId: records.learningModule.id,
          moduleTitle: records.learningModule.title,
          question: blockedSession.question,
          blocker: blockedSession.blocker
        }
      ]
    });
  });

  it("exports learning indexes and relative Markdown paths only", async () => {
    const repository = await createTestRepository();
    const records = createLearningRecords();

    await repository.createSource(records.learningSource);
    await repository.createTrack(records.learningTrack);
    await repository.createModule(records.learningModule);
    await repository.createSession(records.studySession);
    await repository.createEvidence(records.evidenceItem);
    await repository.createKnowledgeCard(records.knowledgeCard);
    await repository.createReviewItem(records.reviewItem);
    await repository.createCoachEvent(records.aiCoachEvent);

    const exported = await repository.exportLearningData();

    expect(exported).toEqual({
      sources: [records.learningSource],
      tracks: [records.learningTrack],
      modules: [records.learningModule],
      sessions: [records.studySession],
      evidence: [records.evidenceItem],
      knowledgeCards: [records.knowledgeCard],
      reviewItems: [records.reviewItem],
      coachEvents: [records.aiCoachEvent]
    });
    expect(JSON.stringify(exported)).toContain(
      "learning/cs336/knowledge/scaled-dot-product-attention.md"
    );
    expect(JSON.stringify(exported)).not.toContain("secret-token");
    expect(JSON.stringify(exported)).not.toContain("assignment-source-code");
  });
});

async function createTestRepository() {
  const databasePath = join(tmpdir(), `planner-learning-repo-${randomUUID()}.sqlite`);
  const connection = createPlannerDatabase({
    url: `file:${databasePath}`
  });

  testDatabases.push({ connection, path: databasePath });
  await migratePlannerDatabase(connection.db);

  return createLearningRepository(connection.db);
}

async function createTestRepositories() {
  const databasePath = join(
    tmpdir(),
    `planner-learning-summary-${randomUUID()}.sqlite`
  );
  const connection = createPlannerDatabase({
    url: `file:${databasePath}`
  });

  testDatabases.push({ connection, path: databasePath });
  await migratePlannerDatabase(connection.db);

  return {
    learningRepository: createLearningRepository(connection.db),
    planningRepository: createPlanningRepository(connection.db)
  };
}

function createLearningRecords() {
  const learningSource: LearningSource = {
    id: "source-cs336",
    title: "CS336 Assignment 1",
    kind: "repo",
    url: "https://github.com/stanford-cs336/assignment1-basics",
    repositoryUrl: "https://github.com/stanford-cs336/assignment1-basics",
    revision: "a158843",
    license: "MIT",
    aiGuidance: "coach_only",
    summary: "User-authored source summary.",
    status: "active",
    createdAt: "2026-10-19T12:00:00.000Z",
    updatedAt: "2026-10-19T12:00:00.000Z"
  };
  const learningTrack: LearningTrack = {
    id: "track-cs336",
    sourceId: learningSource.id,
    title: "CS336 Assignment 1 path",
    objective: "Implement and explain the assignment primitives.",
    status: "active",
    markdownPath: "learning/cs336/track.md",
    createdAt: "2026-10-19T12:00:00.000Z",
    updatedAt: "2026-10-19T12:00:00.000Z"
  };
  const learningModule: LearningModule = {
    id: "module-attention",
    trackId: learningTrack.id,
    title: "Attention and RoPE",
    sequence: 5,
    status: "active",
    expectedOutcome: "Explain causal masking and output shapes.",
    acceptanceCriteria: ["Pass a toy tensor check."],
    markdownPath: "learning/cs336/modules/05-attention-and-rope.md",
    createdAt: "2026-10-19T12:00:00.000Z",
    updatedAt: "2026-10-19T12:00:00.000Z"
  };
  const studySession: StudySession = {
    id: "session-attention",
    moduleId: learningModule.id,
    status: "active",
    question: "Where should the causal mask be applied?",
    preUnderstanding: "Before softmax, I think.",
    markdownPath: "learning/cs336/sessions/2026-10-19-attention.md",
    createdAt: "2026-10-19T13:00:00.000Z",
    updatedAt: "2026-10-19T13:00:00.000Z"
  };
  const evidenceItem: EvidenceItem = {
    id: "evidence-mask",
    sessionId: studySession.id,
    kind: "toy_example",
    title: "Two-token causal mask",
    summary: "The future token receives a masked logit.",
    reference: "tests/test_attention.py::test_causal_mask",
    result: "pass",
    markdownPath: "learning/cs336/experiments/attention-mask.md",
    createdAt: "2026-10-19T13:30:00.000Z"
  };
  const knowledgeCard: KnowledgeCard = {
    id: "card-attention",
    trackId: learningTrack.id,
    moduleId: learningModule.id,
    title: "Scaled dot-product attention",
    slug: "scaled-dot-product-attention",
    sourceIds: [learningSource.id],
    evidenceIds: [evidenceItem.id],
    relatedCardIds: [],
    maturity: "observed",
    confidence: 3,
    summary: "Attention scores are masked before softmax.",
    markdownPath:
      "learning/cs336/knowledge/scaled-dot-product-attention.md",
    createdAt: "2026-10-19T13:40:00.000Z",
    updatedAt: "2026-10-19T13:40:00.000Z"
  };
  const reviewItem: ReviewItem = {
    id: "review-attention",
    knowledgeCardId: knowledgeCard.id,
    prompt: "Why is the mask applied before softmax?",
    nextReviewAt: "2026-10-20T12:00:00.000Z",
    ease: 3,
    reviewCount: 0,
    lapseCount: 0,
    status: "active"
  };
  const aiCoachEvent: AICoachEvent = {
    id: "coach-attention",
    sessionId: studySession.id,
    mode: "debug_guide",
    inputSummary: "Asked for a way to inspect mask placement.",
    outputSummary: "Suggested comparing logits before and after masking.",
    boundary: "allowed",
    createdAt: "2026-10-19T13:50:00.000Z"
  };

  return {
    learningSource,
    learningTrack,
    learningModule,
    studySession,
    evidenceItem,
    knowledgeCard,
    reviewItem,
    aiCoachEvent
  };
}
