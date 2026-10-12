import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SettingsWorkspace } from "./settings-workspace";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("SettingsWorkspace", () => {
  it("shows connection status and can test the connection again", async () => {
    let connectionCalls = 0;
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = getRequestUrl(input);

      if (url.endsWith("/api/settings/database")) {
        return databaseResponse("personal");
      }

      connectionCalls += 1;
      return jsonResponse({
        ok: true,
        connected: true,
        taskCount: connectionCalls === 1 ? 4 : 5
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<SettingsWorkspace />);

    expect(await screen.findByText("Connected")).toBeVisible();
    expect(screen.getByText("4 tasks available")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Test connection" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/vikunja/test-connection");
    });
    expect(await screen.findByText("5 tasks available")).toBeVisible();
  });

  it("shows a safe failure message when Vikunja is unavailable", async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = getRequestUrl(input);

      if (url.endsWith("/api/settings/database")) {
        return databaseResponse("personal");
      }

      return jsonResponse(
        {
          ok: false,
          connected: false,
          error: "Vikunja configuration is incomplete."
        },
        503
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<SettingsWorkspace />);

    expect(await screen.findByText("Not connected")).toBeVisible();
    expect(
      screen.getByText("Vikunja configuration is incomplete.")
    ).toBeVisible();
    expect(screen.queryByText(/token/i)).not.toBeInTheDocument();
  });

  it("shows and switches the database mode", async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = getRequestUrl(input);

      if (url.endsWith("/api/settings/database") && init?.method === "POST") {
        return databaseResponse("test");
      }

      if (url.endsWith("/api/settings/database")) {
        return databaseResponse("personal");
      }

      return jsonResponse({
        ok: false,
        connected: false,
        error: "Vikunja configuration is incomplete."
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<SettingsWorkspace />);

    expect(await screen.findByText("Personal database")).toBeVisible();

    fireEvent.click(
      screen.getByRole("switch", { name: "Use test database" })
    );

    expect(await screen.findByText("Test database")).toBeVisible();
    expect(fetchMock).toHaveBeenCalledWith("/api/settings/database", {
      method: "POST",
      body: JSON.stringify({ mode: "test" }),
      headers: { "Content-Type": "application/json" }
    });
  });
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

function databaseResponse(mode: "personal" | "test"): Response {
  return jsonResponse({
    currentMode: mode,
    modes: [
      {
        id: "personal",
        label: "Personal database",
        active: mode === "personal",
        available: true
      },
      {
        id: "test",
        label: "Test database",
        active: mode === "test",
        available: true
      }
    ]
  });
}

function getRequestUrl(input: string | URL | Request): string {
  if (typeof input === "string") {
    return input;
  }

  if (input instanceof URL) {
    return input.toString();
  }

  return input.url;
}
