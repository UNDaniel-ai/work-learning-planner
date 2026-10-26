import type {
  LearningUseCases,
  LearningTrackDetails
} from "../../domain/learning/use-cases";
import type { DatabaseMode } from "../planning/database-mode";
import type { LearningRepository } from "../db/learning-repositories";

export const CS336_SOURCE_ID = "source-cs336-assignment1";
export const CS336_TRACK_ID = "track-cs336-assignment1";

type Cs336SeedInput = {
  databaseMode: DatabaseMode;
  repository: Pick<LearningRepository, "getSource" | "getTrack">;
  useCases: Pick<
    LearningUseCases,
    "createSource" | "createTrack" | "getTrackDetails"
  >;
};

export async function seedCs336LearningPath(
  input: Cs336SeedInput
): Promise<LearningTrackDetails> {
  if (input.databaseMode !== "test") {
    throw new Error("CS336 seed is restricted to the test database.");
  }

  const existingTrack = await input.repository.getTrack(CS336_TRACK_ID);
  if (existingTrack) {
    return input.useCases.getTrackDetails(existingTrack.id);
  }

  const source =
    (await input.repository.getSource(CS336_SOURCE_ID)) ??
    (await input.useCases.createSource({
      id: CS336_SOURCE_ID,
      title: "Stanford CS336 Assignment 1",
      kind: "repo",
      url: "https://github.com/stanford-cs336/assignment1-basics",
      repositoryUrl:
        "https://github.com/stanford-cs336/assignment1-basics",
      revision: "a158843",
      license: "MIT",
      aiGuidance: "coach_only",
      summary:
        "A test-only learning path for language-model systems fundamentals."
    }));
  const result = await input.useCases.createTrack({
    id: CS336_TRACK_ID,
    sourceId: source.id,
    sourceSlug: "cs336-assignment1",
    title: "CS336 Assignment 1 learning path",
    objective:
      "Build, test, and explain the core components of a small language model.",
    modules: CS336_MODULES.map((learningModule) => ({
      ...learningModule,
      acceptanceCriteria: [...learningModule.acceptanceCriteria]
    }))
  });

  return {
    source,
    track: result.track,
    modules: result.modules
  };
}

const CS336_MODULES = [
  {
    id: "module-cs336-environment",
    slug: "environment-and-test-workflow",
    title: "Environment and test workflow",
    sequence: 1,
    expectedOutcome:
      "Explain the reproducible environment, adapter boundary, and failing-test workflow.",
    acceptanceCriteria: [
      "Describe how the assignment tests reach a learner-owned implementation."
    ]
  },
  {
    id: "module-cs336-data",
    slug: "data-sampling-and-lm-inputs",
    title: "Data sampling and language-model inputs",
    sequence: 2,
    expectedOutcome:
      "Explain context windows, batch sampling, targets, and device boundaries.",
    acceptanceCriteria: ["Verify a sampled batch's shapes and token offsets."]
  },
  {
    id: "module-cs336-tokenizer",
    slug: "tokenizer-and-bpe",
    title: "Tokenizer and BPE",
    sequence: 3,
    expectedOutcome:
      "Explain byte-level tokenization, merges, special tokens, and round trips.",
    acceptanceCriteria: [
      "Record a tokenizer round-trip or merge-order verification."
    ]
  },
  {
    id: "module-cs336-primitives",
    slug: "pytorch-neural-network-primitives",
    title: "PyTorch neural-network primitives",
    sequence: 4,
    expectedOutcome:
      "Explain Linear, Embedding, SiLU, SwiGLU, and RMSNorm behavior.",
    acceptanceCriteria: ["Verify shapes and one numerical invariant."]
  },
  {
    id: "module-cs336-attention",
    slug: "attention-mask-and-rope",
    title: "Attention, mask, and RoPE",
    sequence: 5,
    expectedOutcome:
      "Explain scaled attention, causal masking, multi-head shapes, and RoPE.",
    acceptanceCriteria: [
      "Use a toy tensor to verify mask placement and output shapes."
    ]
  },
  {
    id: "module-cs336-transformer",
    slug: "transformer-block-and-language-model",
    title: "Transformer block and language model",
    sequence: 6,
    expectedOutcome:
      "Explain pre-norm blocks, residual paths, and language-model forward output.",
    acceptanceCriteria: ["Verify an end-to-end forward shape or snapshot."]
  },
  {
    id: "module-cs336-optimization",
    slug: "optimization-schedule-and-checkpoint",
    title: "Optimization, schedule, and checkpoint",
    sequence: 7,
    expectedOutcome:
      "Explain stable loss, clipping, AdamW, learning-rate schedules, and restore behavior.",
    acceptanceCriteria: [
      "Record a numerical, schedule, or checkpoint round-trip check."
    ]
  },
  {
    id: "module-cs336-transfer",
    slug: "performance-explanation-and-transfer",
    title: "Performance, explanation, and transfer",
    sequence: 8,
    expectedOutcome:
      "Explain observed performance and transfer one verified idea to a new example.",
    acceptanceCriteria: [
      "Summarize one measurement and one transfer experiment in the learner's words."
    ]
  }
] as const;
