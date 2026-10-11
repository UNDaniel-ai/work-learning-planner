"use client";

import { Check, Clock3 } from "lucide-react";
import { useState } from "react";
import type { PlannerTask } from "../domain/tasks/provider";

type TaskExecutionListProps = {
  tasks: PlannerTask[];
  onCompleteTask: (taskId: string) => Promise<void> | void;
  onPostponeTask: (
    taskId: string,
    dueDate: string
  ) => Promise<void> | void;
};

export function TaskExecutionList({
  tasks,
  onCompleteTask,
  onPostponeTask
}: TaskExecutionListProps) {
  const [postponeDates, setPostponeDates] = useState<Record<string, string>>(
    {}
  );

  if (tasks.length === 0) {
    return (
      <p className="border border-dashed border-stone-300 px-4 py-5 text-sm text-stone-500">
        No tasks scheduled for today.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-stone-200 border border-stone-200 bg-white/60">
      {tasks.map((task) => {
        const isCompleted = task.status === "completed";

        return (
          <li
            className="flex flex-col gap-3 px-4 py-4 lg:flex-row lg:items-center lg:justify-between"
            key={task.id}
          >
            <div className="min-w-0">
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

            {isCompleted ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-700">
                <Check aria-hidden="true" size={14} />
                Completed
              </span>
            ) : (
              <div className="flex flex-wrap items-end gap-2">
                <button
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-md bg-teal-700 px-3 py-2 text-xs font-medium text-white transition hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
                  onClick={() => void onCompleteTask(task.id)}
                  type="button"
                >
                  <Check aria-hidden="true" size={14} />
                  Complete task
                </button>
                <label className="flex flex-col gap-1 text-[11px] font-medium text-stone-500">
                  Postpone date
                  <input
                    aria-label="Postpone date"
                    className="h-9 rounded-md border border-stone-300 bg-white px-2 text-xs text-stone-950 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
                    onChange={(event) =>
                      setPostponeDates((dates) => ({
                        ...dates,
                        [task.id]: event.target.value
                      }))
                    }
                    type="date"
                    value={postponeDates[task.id] ?? ""}
                  />
                </label>
                <button
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-700 transition hover:border-stone-400 hover:text-stone-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
                  disabled={!postponeDates[task.id]}
                  onClick={() => {
                    const dueDate = postponeDates[task.id];

                    if (dueDate) {
                      void onPostponeTask(task.id, dueDate);
                    }
                  }}
                  type="button"
                >
                  <Clock3 aria-hidden="true" size={14} />
                  Postpone task
                </button>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
