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
      syncCursors: []
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
    await expect(response.json()).resolves.toEqual(snapshot);
    expect(JSON.stringify(snapshot)).not.toContain("VIKUNJA_API_TOKEN");
    expect(JSON.stringify(snapshot)).not.toContain("secret-token");
  });
});
