import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  createPlannerDatabase,
  migratePlannerDatabase,
  type PlannerDatabaseConnection
} from "./client";
import {
  aiCoachEvents,
  evidenceItems,
  knowledgeCards,
  learningModules,
  learningSources,
  learningTracks,
  reviewItems,
  studySessions
} from "./schema";

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

describe("learning schema", () => {
  it("migrates and persists the learning loop records", async () => {
    const { connection } = await createTestDatabase();
    const { db } = connection;

    await db.insert(learningSources).values({
      id: "source-cs336",
      title: "CS336 Assignment 1",
      kind: "repo",
      url: "https://github.com/stanford-cs336/assignment1-basics",
      revision: "a158843",
      aiGuidance: "coach_only",
      status: "active",
      createdAt: "2026-10-19T12:00:00.000Z",
      updatedAt: "2026-10-19T12:00:00.000Z"
    });
    await db.insert(learningTracks).values({
      id: "track-cs336",
      sourceId: "source-cs336",
      title: "CS336 Assignment 1 path",
      objective: "Implement and explain the assignment primitives.",
      status: "active",
      createdAt: "2026-10-19T12:00:00.000Z",
      updatedAt: "2026-10-19T12:00:00.000Z"
    });
    await db.insert(learningModules).values({
      id: "module-attention",
      trackId: "track-cs336",
      title: "Attention and RoPE",
      sequence: 5,
      status: "not_started",
      expectedOutcome: "Explain causal masking and output shapes.",
      acceptanceCriteria: ["Pass a toy tensor check."],
      createdAt: "2026-10-19T12:00:00.000Z",
      updatedAt: "2026-10-19T12:00:00.000Z"
    });
    await db.insert(studySessions).values({
      id: "session-attention",
      moduleId: "module-attention",
      status: "planned",
      question: "Where should the causal mask be applied?",
      preUnderstanding: "Before softmax, I think.",
      createdAt: "2026-10-19T12:00:00.000Z",
      updatedAt: "2026-10-19T12:00:00.000Z"
    });
    await db.insert(evidenceItems).values({
      id: "evidence-mask",
      sessionId: "session-attention",
      kind: "toy_example",
      title: "Two-token causal mask",
      summary: "The future token receives a masked logit.",
      reference: "attention-mask-toy-example.md",
      result: "pass",
      createdAt: "2026-10-19T12:30:00.000Z"
    });
    await db.insert(knowledgeCards).values({
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
      summary: "Attention scores are scaled before masking and softmax.",
      createdAt: "2026-10-19T13:00:00.000Z",
      updatedAt: "2026-10-19T13:00:00.000Z"
    });
    await db.insert(reviewItems).values({
      id: "review-attention",
      knowledgeCardId: "card-attention",
      prompt: "Why is the causal mask applied before softmax?",
      nextReviewAt: "2026-10-20T12:00:00.000Z",
      ease: 3,
      reviewCount: 0,
      lapseCount: 0,
      status: "active"
    });
    await db.insert(aiCoachEvents).values({
      id: "coach-attention",
      sessionId: "session-attention",
      mode: "debug_guide",
      inputSummary: "Asked for an experiment to inspect mask placement.",
      outputSummary: "Suggested checking logits before and after masking.",
      boundary: "allowed",
      createdAt: "2026-10-19T13:10:00.000Z"
    });

    await expect(db.select().from(learningSources)).resolves.toHaveLength(1);
    await expect(db.select().from(learningTracks)).resolves.toHaveLength(1);
    await expect(db.select().from(learningModules)).resolves.toHaveLength(1);
    await expect(db.select().from(studySessions)).resolves.toHaveLength(1);
    await expect(db.select().from(evidenceItems)).resolves.toHaveLength(1);
    await expect(db.select().from(knowledgeCards)).resolves.toHaveLength(1);
    await expect(db.select().from(reviewItems)).resolves.toHaveLength(1);
    await expect(db.select().from(aiCoachEvents)).resolves.toHaveLength(1);
  });
});

async function createTestDatabase(): Promise<{
  connection: PlannerDatabaseConnection;
}> {
  const databasePath = join(tmpdir(), `planner-learning-${randomUUID()}.sqlite`);
  const connection = createPlannerDatabase({
    url: `file:${databasePath}`
  });

  testDatabases.push({ connection, path: databasePath });
  await migratePlannerDatabase(connection.db);

  return { connection };
}
