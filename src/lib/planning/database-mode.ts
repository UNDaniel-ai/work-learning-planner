import type { AppConfig } from "../config";

export const DATABASE_MODE_COOKIE = "planner_database_mode";

export const databaseModes = ["personal", "test"] as const;

export type DatabaseMode = (typeof databaseModes)[number];

export type DatabaseModeOption = {
  id: DatabaseMode;
  label: string;
  active: boolean;
  available: boolean;
};

export type DatabaseModeState = {
  currentMode: DatabaseMode;
  modes: DatabaseModeOption[];
};

export function getDatabaseModeFromRequest(request?: Request): DatabaseMode {
  return parseDatabaseMode(readCookie(request, DATABASE_MODE_COOKIE));
}

export function parseDatabaseMode(value: string | undefined): DatabaseMode {
  return value === "test" ? "test" : "personal";
}

export function serializeDatabaseModeCookie(mode: DatabaseMode): string {
  return `${DATABASE_MODE_COOKIE}=${mode}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

export function createDatabaseModeState(
  config: AppConfig,
  requestedMode: DatabaseMode
): DatabaseModeState {
  const currentMode =
    requestedMode === "test" && !config.testDatabaseUrl ? "personal" : requestedMode;

  return {
    currentMode,
    modes: [
      {
        id: "personal",
        label: "Personal database",
        active: currentMode === "personal",
        available: true
      },
      {
        id: "test",
        label: "Test database",
        active: currentMode === "test",
        available: Boolean(config.testDatabaseUrl)
      }
    ]
  };
}

export function getDatabaseUrlForMode(
  config: AppConfig,
  mode: DatabaseMode
): string {
  if (mode === "test") {
    if (!config.testDatabaseUrl) {
      throw new Error("Test database is not configured.");
    }

    return config.testDatabaseUrl;
  }

  return config.databaseUrl;
}

function readCookie(
  request: Request | undefined,
  cookieName: string
): string | undefined {
  const cookieHeader = request?.headers.get("cookie");

  if (!cookieHeader) {
    return undefined;
  }

  return cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${cookieName}=`))
    ?.slice(cookieName.length + 1);
}
