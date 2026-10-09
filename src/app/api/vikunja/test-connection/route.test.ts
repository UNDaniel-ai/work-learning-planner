import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

describe("GET /api/vikunja/test-connection", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("checks the configured Vikunja connection without exposing the token", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          items: [],
          page: 1,
          per_page: 1,
          total: 0,
          total_pages: 0
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      )
    );
    vi.stubEnv("DATABASE_URL", "file:./data/test.sqlite");
    vi.stubEnv("VIKUNJA_BASE_URL", "https://vikunja.example.test");
    vi.stubEnv("VIKUNJA_API_TOKEN", "secret-token");
    vi.stubGlobal("fetch", fetchMock);

    const response = await GET();

    expect(response.status).toBe(200);
    const payload = await response.json();

    expect(payload).toEqual({
      ok: true,
      connected: true,
      taskCount: 0
    });
    expect(JSON.stringify(payload)).not.toContain("secret-token");
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/v2/tasks"),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer secret-token"
        })
      })
    );
  });

  it("reports incomplete Vikunja configuration", async () => {
    vi.stubEnv("DATABASE_URL", "file:./data/test.sqlite");
    vi.stubEnv("VIKUNJA_BASE_URL", "");
    vi.stubEnv("VIKUNJA_API_TOKEN", "");

    const response = await GET();

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      connected: false,
      error: "Vikunja configuration is incomplete."
    });
  });
});
