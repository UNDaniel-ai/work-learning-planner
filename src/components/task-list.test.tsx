import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { PlannerTask } from "../domain/tasks/provider";
import { TaskList } from "./task-list";

const tasks: PlannerTask[] = [
  {
    id: "task-1",
    title: "Draft weekly plan",
    status: "open",
    labels: ["work"],
    dueDate: "2026-10-10",
    createdAt: "2026-10-09T00:00:00.000Z",
    updatedAt: "2026-10-09T00:00:00.000Z"
  },
  {
    id: "task-2",
    title: "Read TypeScript chapter",
    status: "completed",
    labels: ["learning"],
    createdAt: "2026-10-08T00:00:00.000Z",
    updatedAt: "2026-10-09T00:00:00.000Z",
    completedAt: "2026-10-09T00:00:00.000Z"
  }
];

describe("TaskList", () => {
  it("shows task status, labels, and selection controls", () => {
    render(
      <TaskList
        selectedTaskIds={["task-1"]}
        tasks={tasks}
        onToggleTask={vi.fn()}
      />
    );

    expect(screen.getByText("Draft weekly plan")).toBeVisible();
    expect(screen.getByText("Read TypeScript chapter")).toBeVisible();
    expect(screen.getByText("work")).toBeVisible();
    expect(screen.getByLabelText("Select Draft weekly plan")).toBeChecked();
    expect(screen.getByLabelText("Select Read TypeScript chapter")).toBeDisabled();
  });

  it("reports task selection changes", async () => {
    const onToggleTask = vi.fn();

    render(
      <TaskList
        selectedTaskIds={[]}
        tasks={[tasks[0]]}
        onToggleTask={onToggleTask}
      />
    );

    fireEvent.click(screen.getByLabelText("Select Draft weekly plan"));

    expect(onToggleTask).toHaveBeenCalledWith("task-1");
  });
});
