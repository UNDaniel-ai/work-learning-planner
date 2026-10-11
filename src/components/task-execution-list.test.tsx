import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { PlannerTask } from "../domain/tasks/provider";
import { TaskExecutionList } from "./task-execution-list";

const task: PlannerTask = {
  id: "task-1",
  title: "Draft weekly plan",
  status: "open",
  dueDate: "2026-10-10",
  labels: ["work"],
  createdAt: "2026-10-09T00:00:00.000Z",
  updatedAt: "2026-10-09T00:00:00.000Z"
};

describe("TaskExecutionList", () => {
  it("completes and postpones tasks with the selected due date", () => {
    const onCompleteTask = vi.fn();
    const onPostponeTask = vi.fn();

    render(
      <TaskExecutionList
        tasks={[task]}
        onCompleteTask={onCompleteTask}
        onPostponeTask={onPostponeTask}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Complete task" }));
    fireEvent.change(screen.getByLabelText("Postpone date"), {
      target: { value: "2026-10-12" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Postpone task" }));

    expect(onCompleteTask).toHaveBeenCalledWith("task-1");
    expect(onPostponeTask).toHaveBeenCalledWith("task-1", "2026-10-12");
  });
});
