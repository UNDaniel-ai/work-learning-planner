"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
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

export function SettingsWorkspace() {
  const [connection, setConnection] = useState<ConnectionState>({
    status: "checking"
  });

  const checkConnection = useCallback(() => {
    setConnection({ status: "checking" });
    void loadConnectionState().then(setConnection);
  }, []);

  useEffect(() => {
    let isActive = true;

    async function loadConnection() {
      const nextState = await loadConnectionState();

      if (isActive) {
        setConnection(nextState);
      }
    }

    void loadConnection();

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
