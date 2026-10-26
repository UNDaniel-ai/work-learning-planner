import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type {
  EvidenceItem,
  KnowledgeCard,
  LearningModule,
  LearningTrack,
  StudySession
} from "../../domain/learning/types";
import { createMarkdownAssetWriter } from "./markdown-assets";

let workspaceRoot = "";

beforeEach(async () => {
  workspaceRoot = await mkdtemp(join(tmpdir(), "planner-learning-assets-"));
});

afterEach(async () => {
  await rm(workspaceRoot, { recursive: true, force: true });
});

describe("Markdown learning assets", () => {
  it("writes stable track, module, session, and knowledge-card paths", async () => {
    const writer = createMarkdownAssetWriter({
      workspaceRoot,
      assetsDirectory: "learning"
    });
    const records = createRecords();

    const trackResult = await writer.writeTrack({
      sourceSlug: "cs336-assignment1",
      track: records.track
    });
    const moduleResult = await writer.writeModule({
      sourceSlug: "cs336-assignment1",
      slug: "attention-and-rope",
      learningModule: records.learningModule
    });
    const sessionResult = await writer.writeSession({
      sourceSlug: "cs336-assignment1",
      slug: "attention-mask",
      session: records.session
    });
    const cardResult = await writer.writeKnowledgeCard({
      sourceSlug: "cs336-assignment1",
      card: records.card
    });

    expect(trackResult).toEqual({
      relativePath: "learning/cs336-assignment1/track.md",
      created: true
    });
    expect(moduleResult.relativePath).toBe(
      "learning/cs336-assignment1/modules/05-attention-and-rope.md"
    );
    expect(sessionResult.relativePath).toBe(
      "learning/cs336-assignment1/sessions/2026-10-19-attention-mask.md"
    );
    expect(cardResult.relativePath).toBe(
      "learning/cs336-assignment1/knowledge/scaled-dot-product-attention.md"
    );

    const trackContents = await readAsset(trackResult.relativePath);
    const moduleContents = await readAsset(moduleResult.relativePath);
    const cardContents = await readAsset(cardResult.relativePath);

    expect(trackContents).toContain('id: "track-cs336"');
    expect(trackContents).toContain('sourceId: "source-cs336"');
    expect(moduleContents).toContain('status: "active"');
    expect(moduleContents).toContain('acceptanceCriteria: ["Pass a toy tensor check."]');
    expect(cardContents).toContain('sourceIds: ["source-cs336"]');
    expect(cardContents).toContain('evidenceIds: ["evidence-mask"]');
    expect(cardContents).toContain("## My explanation");
  });

  it("does not overwrite an existing user-authored body", async () => {
    const writer = createMarkdownAssetWriter({
      workspaceRoot,
      assetsDirectory: "learning"
    });
    const { track } = createRecords();
    const firstWrite = await writer.writeTrack({
      sourceSlug: "cs336-assignment1",
      track
    });
    const absolutePath = join(workspaceRoot, firstWrite.relativePath);
    const userContents = "---\nid: track-cs336\n---\n\nMy durable notes.\n";

    await writeFile(absolutePath, userContents, "utf8");

    await expect(
      writer.writeTrack({ sourceSlug: "cs336-assignment1", track })
    ).resolves.toEqual({
      relativePath: firstWrite.relativePath,
      created: false
    });
    await expect(readFile(absolutePath, "utf8")).resolves.toBe(userContents);
  });

  it("writes evidence and updates session metadata without replacing its body", async () => {
    const writer = createMarkdownAssetWriter({
      workspaceRoot,
      assetsDirectory: "learning"
    });
    const records = createRecords();
    const sessionResult = await writer.writeSession({
      sourceSlug: "cs336-assignment1",
      slug: "attention-mask",
      session: records.session
    });
    const sessionPath = join(workspaceRoot, sessionResult.relativePath);
    const original = await readFile(sessionPath, "utf8");
    await writeFile(
      sessionPath,
      original.replace("## Attempt\n", "## Attempt\n\nMy own experiment.\n"),
      "utf8"
    );
    const evidenceResult = await writer.writeEvidence({
      sourceSlug: "cs336-assignment1",
      slug: "attention-mask-toy-example",
      evidence: records.evidence
    });
    const completedSession: StudySession = {
      ...records.session,
      status: "completed",
      outcome: "The mask is applied before softmax.",
      endedAt: "2026-10-19T14:00:00.000Z",
      updatedAt: "2026-10-19T14:00:00.000Z",
      markdownPath: sessionResult.relativePath
    };

    await writer.updateSessionMetadata({
      relativePath: sessionResult.relativePath,
      session: completedSession,
      evidenceIds: [records.evidence.id]
    });

    expect(evidenceResult.relativePath).toBe(
      "learning/cs336-assignment1/experiments/attention-mask-toy-example.md"
    );
    const updated = await readFile(sessionPath, "utf8");
    expect(updated).toContain('status: "completed"');
    expect(updated).toContain('evidenceIds: ["evidence-mask"]');
    expect(updated).toContain("My own experiment.");
  });

  it("updates knowledge-card metadata without replacing its explanation", async () => {
    const writer = createMarkdownAssetWriter({
      workspaceRoot,
      assetsDirectory: "learning"
    });
    const records = createRecords();
    const result = await writer.writeKnowledgeCard({
      sourceSlug: "cs336-assignment1",
      card: records.card
    });
    const absolutePath = join(workspaceRoot, result.relativePath);
    const original = await readFile(absolutePath, "utf8");
    await writeFile(
      absolutePath,
      original.replace("## My explanation\n", "## My explanation\n\nMy durable explanation.\n"),
      "utf8"
    );

    await writer.updateKnowledgeCardMetadata({
      relativePath: result.relativePath,
      card: {
        ...records.card,
        maturity: "understood",
        confidence: 4,
        updatedAt: "2026-10-19T15:00:00.000Z"
      }
    });

    const updated = await readFile(absolutePath, "utf8");
    expect(updated).toContain('maturity: "understood"');
    expect(updated).toContain("confidence: 4");
    expect(updated).toContain("My durable explanation.");
  });

  it("rejects path traversal, absolute asset roots, and unsafe slugs", async () => {
    expect(() =>
      createMarkdownAssetWriter({
        workspaceRoot,
        assetsDirectory: "../outside"
      })
    ).toThrow(/workspace/i);
    expect(() =>
      createMarkdownAssetWriter({
        workspaceRoot,
        assetsDirectory: join(tmpdir(), "outside")
      })
    ).toThrow(/workspace/i);

    const writer = createMarkdownAssetWriter({
      workspaceRoot,
      assetsDirectory: "learning"
    });
    const records = createRecords();

    await expect(
      writer.writeTrack({ sourceSlug: "../escape", track: records.track })
    ).rejects.toThrow(/slug/i);
    await expect(
      writer.writeKnowledgeCard({
        sourceSlug: "cs336-assignment1",
        card: { ...records.card, slug: "/absolute" }
      })
    ).rejects.toThrow(/slug/i);
  });
});

async function readAsset(relativePath: string): Promise<string> {
  return readFile(join(workspaceRoot, relativePath), "utf8");
}

function createRecords() {
  const track: LearningTrack = {
    id: "track-cs336",
    sourceId: "source-cs336",
    title: "CS336 Assignment 1 path",
    objective: "Implement and explain the assignment primitives.",
    status: "active",
    createdAt: "2026-10-19T12:00:00.000Z",
    updatedAt: "2026-10-19T12:00:00.000Z"
  };
  const learningModule: LearningModule = {
    id: "module-attention",
    trackId: track.id,
    title: "Attention and RoPE",
    sequence: 5,
    status: "active",
    expectedOutcome: "Explain causal masking and output shapes.",
    acceptanceCriteria: ["Pass a toy tensor check."],
    createdAt: "2026-10-19T12:00:00.000Z",
    updatedAt: "2026-10-19T12:00:00.000Z"
  };
  const session: StudySession = {
    id: "session-attention",
    moduleId: learningModule.id,
    status: "active",
    question: "Where should the causal mask be applied?",
    preUnderstanding: "Before softmax, I think.",
    createdAt: "2026-10-19T13:00:00.000Z",
    updatedAt: "2026-10-19T13:00:00.000Z"
  };
  const card: KnowledgeCard = {
    id: "card-attention",
    trackId: track.id,
    moduleId: learningModule.id,
    title: "Scaled dot-product attention",
    slug: "scaled-dot-product-attention",
    sourceIds: ["source-cs336"],
    evidenceIds: ["evidence-mask"],
    relatedCardIds: [],
    maturity: "verified",
    confidence: 3,
    summary: "Attention scores are masked before softmax.",
    createdAt: "2026-10-19T14:00:00.000Z",
    updatedAt: "2026-10-19T14:00:00.000Z"
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

  return { track, learningModule, session, card, evidence };
}
