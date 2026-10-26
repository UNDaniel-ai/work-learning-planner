import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const mocks = vi.hoisted(() => ({
  runtime: { repository: {}, useCases: {} },
  seedCs336LearningPath: vi.fn(async () => ({
    source: { id: "source-cs336-assignment1" },
    track: { id: "track-cs336-assignment1" },
    modules: [{ id: "module-cs336-attention" }]
  }))
}));

vi.mock("../../../../../lib/learning/runtime", () => ({
  getLearningRuntime: vi.fn(async () => mocks.runtime)
}));

vi.mock("../../../../../lib/learning/seeds", () => ({
  seedCs336LearningPath: mocks.seedCs336LearningPath
}));

describe("POST /api/learning/seed/cs336", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects the personal database", async () => {
    const response = await POST(
      new Request("http://localhost/api/learning/seed/cs336", {
        method: "POST"
      })
    );

    expect(response.status).toBe(403);
    expect(mocks.seedCs336LearningPath).not.toHaveBeenCalled();
  });

  it("seeds only when the request selects the test database", async () => {
    const response = await POST(
      new Request("http://localhost/api/learning/seed/cs336", {
        method: "POST",
        headers: { cookie: "planner_database_mode=test" }
      })
    );

    expect(response.status).toBe(201);
    expect(mocks.seedCs336LearningPath).toHaveBeenCalledWith({
      databaseMode: "test",
      repository: mocks.runtime.repository,
      useCases: mocks.runtime.useCases
    });
  });
});
