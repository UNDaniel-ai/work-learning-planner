import { describe, expect, it, vi, afterEach } from "vitest";
import { GET } from "./route";

describe("GET /api/health", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("reports application health and Vikunja configuration state", async () => {
    vi.stubEnv("DATABASE_URL", "file:./data/test.sqlite");
    vi.stubEnv("VIKUNJA_BASE_URL", "https://vikunja.example.test");
    vi.stubEnv("VIKUNJA_API_TOKEN", "test-token");

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      app: "work-learning-planner",
      vikunjaConfigured: true
    });
  });
});
