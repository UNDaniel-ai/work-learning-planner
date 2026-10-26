"use client";

import { useEffect, useMemo, useState } from "react";
import type { LearningSessionSummary } from "../domain/learning/types";
import type { PlanningPeriod, TimeBlock } from "../domain/planning/types";
import type { PlannerTask } from "../domain/tasks/provider";
import { MetricBand } from "./page-layout";
import { TaskExecutionList } from "./task-execution-list";
import { TimeBlockGrid } from "./time-block-grid";
import { LearningSessionSummaryList } from "./learning-session-summary-list";

type TodayResponse = {
  date: string;
  planningPeriod: PlanningPeriod | null;
  timeBlocks: TimeBlock[];
  tasks: PlannerTask[];
  learningSessions: LearningSessionSummary[];
};

type TodayWorkspaceProps = {
  date: string;
};

export function TodayWorkspace({ date }: TodayWorkspaceProps) {
  const [tasks, setTasks] = useState<PlannerTask[]>([]);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [planningPeriod, setPlanningPeriod] =
    useState<PlanningPeriod | null>(null);
  const [learningSessions, setLearningSessions] = useState<
    LearningSessionSummary[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();

  const plannedMinutes = useMemo(
    () => timeBlocks.reduce((total, block) => total + block.durationMinutes, 0),
    [timeBlocks]
  );
  const completedTaskCount = tasks.filter(
    (task) => task.status === "completed"
  ).length;

  useEffect(() => {
    let isActive = true;

    async function loadToday() {
      try {
        const data = await getJson<TodayResponse>(
          `/api/planning/today?date=${encodeURIComponent(date)}`
        );

        if (!isActive) {
          return;
        }

        setTasks(data.tasks);
        setTimeBlocks(data.timeBlocks);
        setPlanningPeriod(data.planningPeriod);
        setLearningSessions(data.learningSessions ?? []);
        setError(undefined);
      } catch (loadError) {
        if (isActive) {
          setError(getErrorMessage(loadError));
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadToday();

    return () => {
      isActive = false;
    };
  }, [date]);

  async function recordActual(timeBlockId: string, actualMinutes: number) {
    const timeBlock = await patchJson<TimeBlock>("/api/planning/time-blocks", {
      id: timeBlockId,
      actualMinutes
    });

    setTimeBlocks((currentBlocks) =>
      currentBlocks.map((block) =>
        block.id === timeBlock.id ? timeBlock : block
      )
    );
  }

  async function completeTask(taskId: string) {
    const task = await patchJson<PlannerTask>("/api/planning/tasks", {
      id: taskId,
      action: "complete"
    });

    setTasks((currentTasks) =>
      currentTasks.map((currentTask) =>
        currentTask.id === task.id ? task : currentTask
      )
    );
  }

  async function postponeTask(taskId: string, dueDate: string) {
    const task = await patchJson<PlannerTask>("/api/planning/tasks", {
      id: taskId,
      action: "postpone",
      dueDate
    });

    setTasks((currentTasks) =>
      currentTasks.map((currentTask) =>
        currentTask.id === task.id ? task : currentTask
      )
    );
  }

  if (isLoading) {
    return (
      <p className="border border-stone-200 bg-white/60 px-4 py-5 text-sm text-stone-500">
        Loading today...
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {error ? (
        <p
          className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <MetricBand
        items={[
          {
            label: "Planned focus",
            value: formatDuration(plannedMinutes),
            accent: "text-teal-700"
          },
          {
            label: "Completed tasks",
            value: String(completedTaskCount),
            accent: "text-stone-950"
          },
          {
            label: "Plan status",
            value: planningPeriod ? "Week linked" : "No week",
            accent: "text-amber-700"
          }
        ]}
      />

      <section aria-labelledby="today-blocks-heading" className="space-y-3">
        <div>
          <p className="text-xs font-medium text-stone-500">Time blocks</p>
          <h2
            className="mt-1 text-xl font-semibold text-stone-950"
            id="today-blocks-heading"
          >
            Today&apos;s focus
          </h2>
        </div>
        <TimeBlockGrid
          blocks={timeBlocks}
          onRecordActual={recordActual}
        />
      </section>

      <section aria-labelledby="today-tasks-heading" className="space-y-3">
        <div>
          <p className="text-xs font-medium text-stone-500">Execution</p>
          <h2
            className="mt-1 text-xl font-semibold text-stone-950"
            id="today-tasks-heading"
          >
            Priority tasks
          </h2>
        </div>
        <TaskExecutionList
          tasks={tasks}
          onCompleteTask={completeTask}
          onPostponeTask={postponeTask}
        />
      </section>

      <section aria-labelledby="today-learning-heading" className="space-y-3">
        <div>
          <p className="text-xs font-medium text-stone-500">Learning</p>
          <h2
            className="mt-1 text-xl font-semibold text-stone-950"
            id="today-learning-heading"
          >
            Study sessions
          </h2>
        </div>
        <LearningSessionSummaryList
          emptyMessage="No learning session is linked to today's time blocks."
          linkLabel="Continue learning session"
          sessions={learningSessions}
        />
      </section>
    </div>
  );
}

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url);

  return readJson<T>(response);
}

async function patchJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  return readJson<T>(response);
}

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`Planning API request failed with ${response.status}.`);
  }

  return response.json() as Promise<T>;
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${hours}h ${String(remainingMinutes).padStart(2, "0")}m`;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Today failed to load.";
}
