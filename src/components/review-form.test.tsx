import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ReviewForm } from "./review-form";

describe("ReviewForm", () => {
  it("normalizes review notes and submits daily review inputs", () => {
    const onSubmit = vi.fn();

    render(<ReviewForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("Review type"), {
      target: { value: "daily" }
    });
    fireEvent.change(screen.getByLabelText("Wins"), {
      target: { value: "Finished focus block\nShipped a fix" }
    });
    fireEvent.change(screen.getByLabelText("Misses"), {
      target: { value: "Started too late" }
    });
    fireEvent.change(screen.getByLabelText("Adjustments"), {
      target: { value: "Protect the first hour" }
    });
    fireEvent.change(screen.getByLabelText("Actual minutes"), {
      target: { value: "45" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Save review" }));

    expect(onSubmit).toHaveBeenCalledWith({
      type: "daily",
      wins: ["Finished focus block", "Shipped a fix"],
      misses: ["Started too late"],
      adjustments: ["Protect the first hour"],
      actualMinutes: 45
    });
  });
});
