"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  Database,
  Download,
  PlugZap,
  RefreshCw,
  ShieldCheck,
  WifiOff
} from "lucide-react";
import { ActionLink } from "./page-layout";

type ConnectionResponse = {
  ok: boolean;
  connected: boolean;
  taskCount?: number;
  error?: string;
};

type ConnectionState =
  | { status: "checking" }
  | { status: "connected"; taskCount: number }
  | { status: "disconnected"; message: string };

type DatabaseModeId = "personal" | "test";

type DatabaseModeOption = {
  id: DatabaseModeId;
  label: string;
  active: boolean;
  available: boolean;
};

type DatabaseResponse = {
  currentMode: DatabaseModeId;
  modes: DatabaseModeOption[];
};

type DatabaseState =
  | { status: "loading" }
  | DatabaseResponse & { status: "ready" }
  | { status: "error"; message: string };

export function SettingsWorkspace() {
  const [connection, setConnection] = useState<ConnectionState>({
    status: "checking"
  });
  const [database, setDatabase] = useState<DatabaseState>({
    status: "loading"
  });
  const [databaseSaving, setDatabaseSaving] = useState(false);

  const checkConnection = useCallback(() => {
    setConnection({ status: "checking" });
    void loadConnectionState().then(setConnection);
  }, []);

  const switchDatabaseMode = useCallback(async (mode: DatabaseModeId) => {
    setDatabaseSaving(true);
    const nextState = await saveDatabaseState(mode);
    setDatabase(nextState);
    setDatabaseSaving(false);
  }, []);

  useEffect(() => {
    let isActive = true;

    async function loadSettings() {
      const [nextConnectionState, nextDatabaseState] = await Promise.all([
        loadConnectionState(),
        loadDatabaseState()
      ]);

      if (isActive) {
        setConnection(nextConnectionState);
        setDatabase(nextDatabaseState);
      }
    }

    void loadSettings();

    return () => {
      isActive = false;
    };
  }, []);

  return (
    <div className="space-y-8">
      <section
        aria-labelledby="connection-heading"
        className="border border-stone-200 bg-white/60"
      >
        <div className="flex flex-col gap-4 border-b border-stone-200 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <PlugZap
              aria-hidden="true"
              className="mt-0.5 text-amber-700"
              size={20}
            />
            <div>
              <h2
                className="font-semibold text-stone-950"
                id="connection-heading"
              >
                Vikunja connection
              </h2>
              <p className="mt-1 text-sm leading-6 text-stone-600">
                Connection details stay on the server side.
              </p>
            </div>
          </div>
          <button
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-stone-800 transition hover:border-stone-400 hover:bg-stone-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-wait disabled:opacity-60"
            disabled={connection.status === "checking"}
            onClick={() => void checkConnection()}
            type="button"
          >
            <RefreshCw
              aria-hidden="true"
              className={connection.status === "checking" ? "animate-spin" : ""}
              size={16}
            />
            <span>Test connection</span>
          </button>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium text-stone-500">Status</p>
            <div className="mt-1 flex items-center gap-2 text-sm text-stone-800">
              {connection.status === "connected" ? (
                <CheckCircle2
                  aria-hidden="true"
                  className="text-teal-700"
                  size={16}
                />
              ) : (
                <WifiOff
                  aria-hidden="true"
                  className="text-amber-700"
                  size={16}
                />
              )}
              <span>
                {connection.status === "checking"
                  ? "Checking"
                  : connection.status === "connected"
                    ? "Connected"
                    : "Not connected"}
              </span>
            </div>
            {connection.status === "disconnected" ? (
              <p className="mt-2 text-sm leading-6 text-red-700" role="alert">
                {connection.message}
              </p>
            ) : null}
          </div>
          <div>
            <p className="text-xs font-medium text-stone-500">Tasks</p>
            <p className="mt-1 text-sm text-stone-800">
              {connection.status === "connected"
                ? `${connection.taskCount} ${
                    connection.taskCount === 1 ? "task" : "tasks"
                  } available`
                : "Unavailable"}
            </p>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="database-heading"
        className="border border-stone-200 bg-white/60"
      >
        <div className="flex flex-col gap-4 border-b border-stone-200 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Database
              aria-hidden="true"
              className="mt-0.5 text-teal-700"
              size={20}
            />
            <div>
              <h2 className="font-semibold text-stone-950" id="database-heading">
                Database mode
              </h2>
              <p className="mt-1 text-sm leading-6 text-stone-600">
                Planning pages read from one local database at a time.
              </p>
            </div>
          </div>
          <label className="inline-flex min-h-10 items-center gap-3 text-sm font-medium text-stone-800">
            <span>Use test database</span>
            <input
              aria-label="Use test database"
              checked={database.status === "ready" && database.currentMode === "test"}
              className="peer sr-only"
              disabled={
                database.status !== "ready" ||
                databaseSaving ||
                !database.modes.find((mode) => mode.id === "test")?.available
              }
              onChange={(event) =>
                void switchDatabaseMode(
                  event.currentTarget.checked ? "test" : "personal"
                )
              }
              role="switch"
              type="checkbox"
            />
            <span
              aria-hidden="true"
              className="relative h-6 w-11 rounded-full bg-stone-300 transition peer-checked:bg-teal-700 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-teal-700 peer-disabled:opacity-50 after:absolute after:left-1 after:top-1 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-5"
            />
          </label>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium text-stone-500">Active database</p>
            <p className="mt-1 text-sm text-stone-800">
              {database.status === "loading"
                ? "Loading"
                : database.status === "error"
                  ? "Unavailable"
                  : getActiveDatabaseLabel(database)}
            </p>
            {database.status === "error" ? (
              <p className="mt-2 text-sm leading-6 text-red-700" role="alert">
                {database.message}
              </p>
            ) : null}
          </div>
          <div>
            <p className="text-xs font-medium text-stone-500">Test database</p>
            <p className="mt-1 text-sm text-stone-800">
              {database.status === "ready" &&
              database.modes.find((mode) => mode.id === "test")?.available
                ? "Available"
                : "Unavailable"}
            </p>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="data-heading"
        className="border border-stone-200 bg-white/60"
      >
        <div className="flex items-start gap-3 border-b border-stone-200 p-5">
          <ShieldCheck
            aria-hidden="true"
            className="mt-0.5 text-teal-700"
            size={20}
          />
          <div>
            <h2 className="font-semibold text-stone-950" id="data-heading">
              Local planning data
            </h2>
            <p className="mt-1 text-sm leading-6 text-stone-600">
              Goals, time blocks, and reviews are stored in the local SQLite
              database.
            </p>
          </div>
        </div>
        <div className="p-5">
          <ActionLink href="/api/export" icon={<Download size={16} />}>
            Export planning data
          </ActionLink>
        </div>
      </section>
    </div>
  );
}

async function readJson<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

async function loadConnectionState(): Promise<ConnectionState> {
  try {
    const response = await fetch("/api/vikunja/test-connection");
    const payload = await readJson<ConnectionResponse>(response);

    if (!response.ok || !payload.connected) {
      return {
        status: "disconnected",
        message: payload.error ?? "Vikunja connection failed."
      };
    }

    return {
      status: "connected",
      taskCount: payload.taskCount ?? 0
    };
  } catch {
    return {
      status: "disconnected",
      message: "Unable to reach the connection check."
    };
  }
}

async function loadDatabaseState(): Promise<DatabaseState> {
  try {
    const response = await fetch("/api/settings/database");
    const payload = await readJson<DatabaseResponse>(response);

    if (!response.ok) {
      return {
        status: "error",
        message: "Unable to load database mode."
      };
    }

    return {
      status: "ready",
      ...payload
    };
  } catch {
    return {
      status: "error",
      message: "Unable to load database mode."
    };
  }
}

async function saveDatabaseState(mode: DatabaseModeId): Promise<DatabaseState> {
  try {
    const response = await fetch("/api/settings/database", {
      method: "POST",
      body: JSON.stringify({ mode }),
      headers: { "Content-Type": "application/json" }
    });
    const payload = await readJson<DatabaseResponse>(response);

    if (!response.ok) {
      return {
        status: "error",
        message: "Unable to switch database mode."
      };
    }

    return {
      status: "ready",
      ...payload
    };
  } catch {
    return {
      status: "error",
      message: "Unable to switch database mode."
    };
  }
}

function getActiveDatabaseLabel(database: DatabaseResponse): string {
  return (
    database.modes.find((mode) => mode.id === database.currentMode)?.label ??
    "Personal database"
  );
}
