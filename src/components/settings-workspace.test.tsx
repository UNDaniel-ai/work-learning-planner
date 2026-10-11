import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SettingsWorkspace } from "./settings-workspace";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("SettingsWorkspace", () => {
  it("shows connection status and can test the connection again", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          ok: true,
          connected: true,
          taskCount: 4
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          ok: true,
          connected: true,
          taskCount: 5
        })
      );
    vi.stubGlobal("fetch", fetchMock);

    render(<SettingsWorkspace />);

    expect(await screen.findByText("Connected")).toBeVisible();
    expect(screen.getByText("4 tasks available")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Test connection" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
    expect(await screen.findByText("5 tasks available")).toBeVisible();
  });

  it("shows a safe failure message when Vikunja is unavailable", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(
        {
          ok: false,
          connected: false,
          error: "Vikunja configuration is incomplete."
        },
        503
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<SettingsWorkspace />);

    expect(await screen.findByText("Not connected")).toBeVisible();
    expect(
      screen.getByText("Vikunja configuration is incomplete.")
    ).toBeVisible();
    expect(screen.queryByText(/token/i)).not.toBeInTheDocument();
  });
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
