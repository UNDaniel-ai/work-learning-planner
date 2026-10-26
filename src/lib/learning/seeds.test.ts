import { describe, expect, it, vi } from "vitest";
import type {
  CreateSourceUseCaseInput,
  CreateTrackUseCaseInput
} from "../../domain/learning/use-cases";
import { seedCs336LearningPath } from "./seeds";

describe("CS336 learning seed", () => {
  it("refuses to seed the personal database", async () => {
    await expect(
      seedCs336LearningPath({
        databaseMode: "personal",
        repository: {
          getSource: vi.fn(),
          getTrack: vi.fn()
        },
        useCases: {
          createSource: vi.fn(),
          createTrack: vi.fn(),
          getTrackDetails: vi.fn()
        }
      })
    ).rejects.toThrow(/test database/i);
  });

  it("creates the pinned coach-only source and eight ordered modules", async () => {
    const createSource = vi.fn(async (input: CreateSourceUseCaseInput) => ({
      ...input,
      status: "active" as const,
      createdAt: "2026-10-19T12:00:00.000Z",
      updatedAt: "2026-10-19T12:00:00.000Z"
    }));
    const createTrack = vi.fn(async (input: CreateTrackUseCaseInput) => ({
      track: {
        id: input.id,
        sourceId: input.sourceId,
        title: input.title,
        objective: input.objective,
        status: "active" as const,
        markdownPath: "temp/e2e-learning-assets/cs336-assignment1/track.md",
        createdAt: "2026-10-19T12:00:00.000Z",
        updatedAt: "2026-10-19T12:00:00.000Z"
      },
      modules: input.modules.map((item) => ({
        id: item.id,
        trackId: input.id,
        title: item.title,
        sequence: item.sequence,
        status: "not_started" as const,
        expectedOutcome: item.expectedOutcome,
        acceptanceCriteria: item.acceptanceCriteria,
        createdAt: "2026-10-19T12:00:00.000Z",
        updatedAt: "2026-10-19T12:00:00.000Z"
      }))
    }));
    const repository = {
      getSource: vi.fn(async () => undefined),
      getTrack: vi.fn(async () => undefined)
    };

    const result = await seedCs336LearningPath({
      databaseMode: "test",
      repository,
      useCases: {
        createSource,
        createTrack,
        getTrackDetails: vi.fn()
      }
    });

    expect(createSource).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "source-cs336-assignment1",
        revision: expect.any(String),
        aiGuidance: "coach_only"
      })
    );
    expect(createTrack).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "track-cs336-assignment1",
        sourceId: "source-cs336-assignment1",
        sourceSlug: "cs336-assignment1",
        modules: expect.arrayContaining([
          expect.objectContaining({
            id: "module-cs336-attention",
            title: "Attention, mask, and RoPE",
            sequence: 5
          })
        ])
      })
    );
    expect(result.modules).toHaveLength(8);
    expect(result.modules.map((item) => item.sequence)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8
    ]);
  });
});
