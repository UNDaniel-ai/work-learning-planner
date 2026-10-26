import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  LearningModule,
  LearningSource,
  LearningTrack
} from "../../../domain/learning/types";
import { LearningUseCaseError } from "../../../domain/learning/use-cases";
import {
  GET as getSources,
  POST as postSource
} from "./sources/route";
import {
  GET as getTracks,
  POST as postTrack
} from "./tracks/route";
import { GET as getTrackDetails } from "./tracks/[trackId]/route";

const mocks = vi.hoisted(() => {
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
    status: "not_started",
    expectedOutcome: "Explain masking and output shapes.",
    acceptanceCriteria: ["Pass a toy tensor check."],
    markdownPath: "learning/cs336-assignment1/modules/05-attention-and-rope.md",
    createdAt: "2026-10-19T12:00:00.000Z",
    updatedAt: "2026-10-19T12:00:00.000Z"
  };

  return {
    source,
    track,
    learningModule,
    repository: {
      listSources: vi.fn(async () => [source]),
      listTracks: vi.fn(async () => [track])
    },
    useCases: {
      createSource: vi.fn(async () => source),
      createTrack: vi.fn(async () => ({
        track,
        modules: [learningModule]
      })),
      getTrackDetails: vi.fn(async () => ({
        source,
        track,
        modules: [learningModule]
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

describe("learning source and track API routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists and creates learning sources", async () => {
    await expect((await getSources()).json()).resolves.toEqual({
      sources: [mocks.source]
    });
    const request = jsonRequest("http://localhost/api/learning/sources", {
      id: "source-cs336",
      title: "CS336 Assignment 1",
      kind: "repo",
      url: "https://github.com/stanford-cs336/assignment1-basics",
      revision: "a158843",
      aiGuidance: "coach_only"
    });
    const response = await postSource(request);

    expect(response.status).toBe(201);
    expect(mocks.useCases.createSource).toHaveBeenCalledWith({
      id: "source-cs336",
      title: "CS336 Assignment 1",
      kind: "repo",
      url: "https://github.com/stanford-cs336/assignment1-basics",
      revision: "a158843",
      aiGuidance: "coach_only"
    });
  });

  it("returns readable 4xx responses for invalid URLs and duplicate IDs", async () => {
    const invalidResponse = await postSource(
      jsonRequest("http://localhost/api/learning/sources", {
        title: "Invalid",
        kind: "repo",
        url: "not-a-url",
        aiGuidance: "coach_only"
      })
    );

    expect(invalidResponse.status).toBe(400);
    mocks.useCases.createSource.mockRejectedValueOnce(
      new LearningUseCaseError(
        "DUPLICATE_LEARNING_ID",
        "Learning source already exists: source-cs336"
      )
    );
    const duplicateResponse = await postSource(
      jsonRequest("http://localhost/api/learning/sources", {
        id: "source-cs336",
        title: "CS336 Assignment 1",
        kind: "repo",
        url: "https://github.com/stanford-cs336/assignment1-basics",
        aiGuidance: "coach_only"
      })
    );

    expect(duplicateResponse.status).toBe(409);
    await expect(duplicateResponse.json()).resolves.toMatchObject({
      code: "DUPLICATE_LEARNING_ID"
    });
  });

  it("creates a track with modules and loads its details", async () => {
    await expect((await getTracks()).json()).resolves.toEqual({
      tracks: [mocks.track]
    });
    const createResponse = await postTrack(
      jsonRequest("http://localhost/api/learning/tracks", {
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
      })
    );

    expect(createResponse.status).toBe(201);
    await expect(createResponse.json()).resolves.toEqual({
      track: mocks.track,
      modules: [mocks.learningModule]
    });
    const detailResponse = await getTrackDetails(
      new Request("http://localhost/api/learning/tracks/track-cs336"),
      { params: Promise.resolve({ trackId: "track-cs336" }) }
    );

    expect(detailResponse.status).toBe(200);
    await expect(detailResponse.json()).resolves.toEqual({
      source: mocks.source,
      track: mocks.track,
      modules: [mocks.learningModule]
    });
  });

  it("returns 404 when a track does not exist", async () => {
    mocks.useCases.getTrackDetails.mockRejectedValueOnce(
      new LearningUseCaseError(
        "LEARNING_TRACK_NOT_FOUND",
        "Learning track not found: missing"
      )
    );

    const response = await getTrackDetails(
      new Request("http://localhost/api/learning/tracks/missing"),
      { params: Promise.resolve({ trackId: "missing" }) }
    );

    expect(response.status).toBe(404);
  });
});

function jsonRequest(url: string, body: unknown): Request {
  return new Request(url, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" }
  });
}
