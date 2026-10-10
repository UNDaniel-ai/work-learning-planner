"use client";

import type { PlannerTask } from "../domain/tasks/provider";

type TaskListProps = {
  tasks: PlannerTask[];
  selectedTaskIds: string[];
  onToggleTask: (taskId: string) => void;
};

export function TaskList({
  tasks,
  selectedTaskIds,
  onToggleTask
}: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <p className="border border-dashed border-stone-300 px-4 py-5 text-sm text-stone-500">
        No open tasks available.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-stone-200 border border-stone-200 bg-white/60">
      {tasks.map((task) => {
        const isCompleted = task.status === "completed";
        const isSelected = selectedTaskIds.includes(task.id);

        return (
          <li className="flex items-start gap-3 px-4 py-3" key={task.id}>
            <input
              aria-label={`Select ${task.title}`}
              checked={isSelected}
              className="mt-0.5 h-4 w-4 shrink-0 accent-teal-700"
              disabled={isCompleted}
              onChange={() => onToggleTask(task.id)}
              type="checkbox"
            />
            <div className="min-w-0 flex-1">
              <p
                className={[
                  "text-sm font-medium",
                  isCompleted
                    ? "text-stone-400 line-through"
                    : "text-stone-950"
                ].join(" ")}
              >
                {task.title}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-stone-500">
                {task.dueDate ? <span>Due {task.dueDate}</span> : null}
                {task.labels.map((label) => (
                  <span
                    className="rounded-full bg-stone-100 px-2 py-0.5 text-stone-600"
                    key={`${task.id}-${label}`}
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
