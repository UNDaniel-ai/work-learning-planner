import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppShell } from "./app-shell";
import GoalsPage from "../app/goals/page";
import ReviewPage from "../app/review/page";
import SettingsPage from "../app/settings/page";
import TodayPage from "../app/today/page";
import WeeklyPage from "../app/weekly/page";

vi.mock("next/navigation", () => ({
  usePathname: () => "/today"
}));

describe("AppShell", () => {
  it("renders the primary planning navigation and connection status", () => {
    render(
      <AppShell>
        <div>Page content</div>
      </AppShell>
    );

    const primaryNav = screen.getByRole("navigation", { name: "Primary" });

    expect(primaryNav).toBeVisible();
    expect(within(primaryNav).getByRole("link", { name: /Today/i })).toHaveAttribute(
      "href",
      "/today"
    );
    expect(within(primaryNav).getByRole("link", { name: /Weekly/i })).toHaveAttribute(
      "href",
      "/weekly"
    );
    expect(
      within(primaryNav).getByRole("link", { name: /Goals & Learning/i })
    ).toHaveAttribute("href", "/goals");
    expect(within(primaryNav).getByRole("link", { name: /Review/i })).toHaveAttribute(
      "href",
      "/review"
    );
    expect(within(primaryNav).getByRole("link", { name: /Settings/i })).toHaveAttribute(
      "href",
      "/settings"
    );
    expect(screen.getByRole("status")).toHaveTextContent("Vikunja");
    expect(screen.getByRole("status")).toHaveTextContent("Not connected");
    expect(within(primaryNav).getByRole("link", { name: /Today/i })).toHaveAttribute(
      "aria-current",
      "page"
    );
  });

  it("provides a focused page entry for each MVP workflow", () => {
    const pages = [
      { component: <TodayPage />, heading: "Today" },
      { component: <WeeklyPage />, heading: "Weekly Plan" },
      { component: <GoalsPage />, heading: "Goals & Learning" },
      { component: <ReviewPage />, heading: "Review" },
      { component: <SettingsPage />, heading: "Settings" }
    ];

    for (const page of pages) {
      const { unmount } = render(page.component);

      expect(
        screen.getByRole("heading", { name: page.heading })
      ).toBeVisible();
      unmount();
    }
  });
});
