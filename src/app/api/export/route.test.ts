import { describe, expect, it, vi } from "vitest";
import type { PlanningDataExport } from "../../../lib/db/repositories";
import { GET } from "./route";

const mocks = vi.hoisted(() => ({
  exportPlanningData: vi.fn()
}));

vi.mock("../../../lib/planning/runtime", () => ({
  getPlanningRuntime: vi.fn(async () => ({
    repository: {
      exportPlanningData: mocks.exportPlanningData
    }
  }))
}));

describe("GET /api/export", () => {
  it("downloads local planning data without credentials", async () => {
    const snapshot: PlanningDataExport = {
      areas: [],
      goals: [
        {
          id: "goal-1",
          areaId: "area-work",
          title: "Ship planner MVP",
          horizon: "quarter",
          status: "active",
          createdAt: "2026-10-09T00:00:00.000Z"
        }
      ],
      learningTopics: [],
      planningPeriods: [],
      timeBlocks: [],
      reviews: [],
      taskLinks: [],
      syncCursors: [],
      learning: {
        sources: [
          {
            id: "source-cs336",
            title: "CS336 Assignment 1",
            kind: "repo",
            url: "https://github.com/stanford-cs336/assignment1-basics",
            repositoryUrl:
              "https://github.com/stanford-cs336/assignment1-basics",
            revision: "a158843",
            aiGuidance: "coach_only",
            summary: "User-authored source summary.",
            status: "active",
            createdAt: "2026-10-09T08:00:00.000Z",
            updatedAt: "2026-10-09T08:00:00.000Z"
          }
        ],
        tracks: [
          {
            id: "track-cs336",
            sourceId: "source-cs336",
            title: "CS336 Assignment 1 path",
            objective: "Explain the assignment primitives.",
            status: "active",
            markdownPath: "learning/cs336/track.md",
            createdAt: "2026-10-09T08:00:00.000Z",
            updatedAt: "2026-10-09T08:00:00.000Z"
          }
        ],
        modules: [],
        sessions: [],
        evidence: [],
        knowledgeCards: [],
        reviewItems: [],
        coachEvents: []
      }
    };
    mocks.exportPlanningData.mockResolvedValueOnce(snapshot);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain(
      "application/json"
    );
    expect(response.headers.get("content-disposition")).toBe(
      'attachment; filename="work-learning-planner-export.json"'
    );
    const exported = await response.json();

    expect(exported).toEqual(snapshot);
    expect(exported.learning.tracks[0].markdownPath).toBe(
      "learning/cs336/track.md"
    );
    expect(exported.learning.tracks[0].markdownPath).not.toMatch(/^\//);
    expect(JSON.stringify(exported)).not.toContain("VIKUNJA_API_TOKEN");
    expect(JSON.stringify(exported)).not.toContain("secret-token");
    expect(JSON.stringify(exported)).not.toContain(
      "verbatim external assignment text"
    );
    expect(JSON.stringify(exported)).not.toContain("assignment-source-code");
  });
});
