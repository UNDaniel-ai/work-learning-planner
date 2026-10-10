import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { TimeBlock } from "../domain/planning/types";
import { TimeBlockGrid } from "./time-block-grid";

const blocks: TimeBlock[] = [
  {
    id: "block-1",
    periodId: "period-1",
    areaId: "area-work",
    startsAt: "2026-10-09T09:00:00.000Z",
    endsAt: "2026-10-09T10:30:00.000Z",
    durationMinutes: 90,
    actualMinutes: 75,
    note: "Focused implementation"
  }
];

describe("TimeBlockGrid", () => {
  it("renders scheduled blocks and planned versus actual minutes", () => {
    render(
      <TimeBlockGrid
        blocks={blocks}
        onCreateTimeBlock={vi.fn()}
      />
    );

    expect(screen.getByText("Focused implementation")).toBeVisible();
    expect(screen.getByText("90 min planned")).toBeVisible();
    expect(screen.getByText("75 min actual")).toBeVisible();
  });

  it("submits a new time block", async () => {
    const onCreateTimeBlock = vi.fn().mockResolvedValue(undefined);

    render(
      <TimeBlockGrid
        blocks={[]}
        onCreateTimeBlock={onCreateTimeBlock}
      />
    );

    fireEvent.change(screen.getByLabelText("Start"), {
      target: { value: "09:00" }
    });
    fireEvent.change(screen.getByLabelText("End"), {
      target: { value: "10:30" }
    });
    fireEvent.change(screen.getByLabelText("Note"), {
      target: { value: "Study testing" }
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Add time block" })
    );

    expect(onCreateTimeBlock).toHaveBeenCalledWith({
      startsAt: "09:00",
      endsAt: "10:30",
      note: "Study testing"
    });
  });
});
