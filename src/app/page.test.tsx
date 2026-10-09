import { describe, expect, it, vi } from "vitest";

const redirectMock = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: redirectMock
}));

describe("home route", () => {
  it("redirects the root route to Today", async () => {
    const { default: HomePage } = await import("./page");

    HomePage();

    expect(redirectMock).toHaveBeenCalledWith("/today");
  });
});
