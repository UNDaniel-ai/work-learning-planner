import { describe, expect, it, vi, afterEach } from "vitest";

async function loadConfig() {
  vi.resetModules();
  const configModule = await import("./config");
  return configModule.getConfig;
}

describe("app config", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("fails clearly when DATABASE_URL is missing", async () => {
    vi.stubEnv("DATABASE_URL", "");

    const getConfig = await loadConfig();

    expect(() => getConfig()).toThrow(/DATABASE_URL/);
  });

  it("normalizes database and optional Vikunja settings", async () => {
    vi.stubEnv("DATABASE_URL", "file:./data/test.sqlite");
    vi.stubEnv("TEST_DATABASE_URL", "file:./data/e2e.sqlite");
    vi.stubEnv("VIKUNJA_BASE_URL", "https://vikunja.example.test");
    vi.stubEnv("VIKUNJA_API_TOKEN", "test-token");

    const getConfig = await loadConfig();

    expect(getConfig()).toEqual({
      databaseUrl: "file:./data/test.sqlite",
      testDatabaseUrl: "file:./data/e2e.sqlite",
      vikunja: {
        baseUrl: "https://vikunja.example.test",
        apiToken: "test-token"
      }
    });
  });

  it("derives a local test database url when one is not provided", async () => {
    vi.stubEnv("DATABASE_URL", "file:local.db");
    vi.stubEnv("TEST_DATABASE_URL", "");

    const getConfig = await loadConfig();

    expect(getConfig()).toMatchObject({
      databaseUrl: "file:local.db",
      testDatabaseUrl: "file:local.test.db"
    });
  });
});
