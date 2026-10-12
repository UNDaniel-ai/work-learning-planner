import { describe, expect, it, vi, afterEach } from "vitest";
import { GET, POST } from "./route";

describe("/api/settings/database", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns the active personal database mode by default", async () => {
    vi.stubEnv("DATABASE_URL", "file:local.db");
    vi.stubEnv("TEST_DATABASE_URL", "file:local.test.db");

    const response = await GET(
      new Request("http://localhost/api/settings/database")
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      currentMode: "personal",
      modes: [
        {
          id: "personal",
          label: "Personal database",
          active: true,
          available: true
        },
        {
          id: "test",
          label: "Test database",
          active: false,
          available: true
        }
      ]
    });
  });

  it("sets a cookie when switching to the test database", async () => {
    vi.stubEnv("DATABASE_URL", "file:local.db");
    vi.stubEnv("TEST_DATABASE_URL", "file:local.test.db");

    const response = await POST(
      new Request("http://localhost/api/settings/database", {
        method: "POST",
        body: JSON.stringify({ mode: "test" }),
        headers: { "Content-Type": "application/json" }
      })
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Set-Cookie")).toContain(
      "planner_database_mode=test"
    );
    await expect(response.json()).resolves.toMatchObject({
      currentMode: "test"
    });
  });
});
