"use client";

import { CalendarDays, Target } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { LearningSessionSummary } from "../domain/learning/types";
import type { Goal, PlanningPeriod, TimeBlock } from "../domain/planning/types";
import type { PlannerTask } from "../domain/tasks/provider";
import { TaskList } from "./task-list";
import {
  TimeBlockGrid,
  type CreateTimeBlockFormInput
} from "./time-block-grid";
import { LearningSessionSummaryList } from "./learning-session-summary-list";

type GoalsResponse = {
  goals: Goal[];
};

type TasksResponse = {
  tasks: PlannerTask[];
};

type WeeklyResponse = {
  planningPeriods: PlanningPeriod[];
  timeBlocks: TimeBlock[];
  learningSessions: LearningSessionSummary[];
};

type WeeklyPlannerProps = {
  anchorDate?: string;
};

export function WeeklyPlanner({ anchorDate = getTodayDate() }: WeeklyPlannerProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [tasks, setTasks] = useState<PlannerTask[]>([]);
  const [planningPeriods, setPlanningPeriods] = useState<PlanningPeriod[]>([]);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [learningSessions, setLearningSessions] = useState<
    LearningSessionSummary[]
  >([]);
  const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();

  const currentPeriod = useMemo(
    () => findPlanningPeriod(planningPeriods, anchorDate),
    [anchorDate, planningPeriods]
  );
  const currentBlocks = useMemo(
    () =>
      currentPeriod
        ? timeBlocks.filter((block) => block.periodId === currentPeriod.id)
        : [],
    [currentPeriod, timeBlocks]
  );
  const plannedMinutes = currentBlocks.reduce(
    (total, block) => total + block.durationMinutes,
    0
  );
  const currentLearningSessions = currentPeriod
    ? learningSessions.filter(
        ({ session }) => session.planningPeriodId === currentPeriod.id
      )
    : [];

  useEffect(() => {
    let isActive = true;

    async function loadWeeklyPlanner() {
      try {
        const [goalData, taskData, weeklyData] = await Promise.all([
          getJson<GoalsResponse>("/api/planning/goals"),
          getJson<TasksResponse>("/api/planning/tasks"),
          getJson<WeeklyResponse>("/api/planning/weekly")
        ]);
        const loadedPeriod = findPlanningPeriod(
          weeklyData.planningPeriods,
          anchorDate
        );

        if (!isActive) {
          return;
        }

        setGoals(goalData.goals);
        setTasks(taskData.tasks);
        setPlanningPeriods(weeklyData.planningPeriods);
        setTimeBlocks(weeklyData.timeBlocks);
        setLearningSessions(weeklyData.learningSessions ?? []);
        setSelectedGoalIds(loadedPeriod?.focusGoalIds ?? []);
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

    void loadWeeklyPlanner();

    return () => {
      isActive = false;
    };
  }, [anchorDate]);

  function toggleGoal(goalId: string) {
    setSelectedGoalIds((currentIds) => toggleId(currentIds, goalId));
  }

  function toggleTask(taskId: string) {
    setSelectedTaskIds((currentIds) => toggleId(currentIds, taskId));
  }

  async function createWeeklyPlan() {
    const period = await postJson<PlanningPeriod>("/api/planning/weekly", {
      anchorDate,
      focusGoalIds: selectedGoalIds,
      tasks: tasks
        .filter((task) => selectedTaskIds.includes(task.id))
        .map(toCreateWeeklyPlanTask)
    });

    setPlanningPeriods((currentPeriods) => [
      period,
      ...currentPeriods.filter((item) => item.id !== period.id)
    ]);
    setSelectedGoalIds(period.focusGoalIds);
    setError(undefined);
  }

  async function createTimeBlock(input: CreateTimeBlockFormInput) {
    if (!currentPeriod) {
      return;
    }

    const timeBlock = await postJson<TimeBlock>("/api/planning/time-blocks", {
      periodId: currentPeriod.id,
      areaId: "area-work",
      startsAt: combineDateAndTime(anchorDate, input.startsAt),
      endsAt: combineDateAndTime(anchorDate, input.endsAt),
      note: input.note
    });

    setTimeBlocks((currentBlocks) =>
      [...currentBlocks, timeBlock].sort((left, right) =>
        left.startsAt.localeCompare(right.startsAt)
      )
    );
    setError(undefined);
  }

  if (isLoading) {
    return (
      <p className="border border-stone-200 bg-white/60 px-4 py-5 text-sm text-stone-500">
        Loading weekly plan...
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {error ? (
        <p
          className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1.4fr_0.6fr]">
        <section aria-labelledby="weekly-focus-heading" className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
              <Target aria-hidden="true" size={17} />
            </span>
            <div>
              <p className="text-xs font-medium text-stone-500">
                Planning period
              </p>
              <h2
                className="text-lg font-semibold text-stone-950"
                id="weekly-focus-heading"
              >
                This week&apos;s focus
              </h2>
            </div>
          </div>

          <div className="space-y-2">
            {goals.length > 0 ? (
              goals.map((goal) => (
                <label
                  className="flex items-start gap-3 border border-stone-200 bg-white/70 px-4 py-3 text-sm"
                  key={goal.id}
                >
                  <input
                    aria-label={`Focus ${goal.title}`}
                    checked={selectedGoalIds.includes(goal.id)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-teal-700"
                    onChange={() => toggleGoal(goal.id)}
                    type="checkbox"
                  />
                  <span>
                    <span className="block font-medium text-stone-950">
                      {goal.title}
                    </span>
                    <span className="mt-1 block text-xs text-stone-500">
                      {goal.horizon}
                    </span>
                  </span>
                </label>
              ))
            ) : (
              <p className="border border-dashed border-stone-300 px-4 py-5 text-sm text-stone-500">
                Add a goal before choosing a weekly focus.
              </p>
            )}
          </div>

          <TaskList
            selectedTaskIds={selectedTaskIds}
            tasks={tasks}
            onToggleTask={toggleTask}
          />

          <button
            className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-stone-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-stone-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
            onClick={() => void createWeeklyPlan()}
            type="button"
          >
            <CalendarDays aria-hidden="true" size={16} />
            Create weekly plan
          </button>
        </section>

        <section className="border border-stone-200 bg-white/60 p-5">
          <p className="text-xs font-medium text-stone-500">Capacity</p>
          <p className="mt-2 text-3xl font-semibold text-stone-950">
            {formatHours(plannedMinutes)}
          </p>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            {currentPeriod
              ? "Week saved"
              : "Create the week before scheduling time blocks."}
          </p>
        </section>
      </div>

      <section aria-labelledby="time-blocks-heading" className="space-y-3">
        <div>
          <p className="text-xs font-medium text-stone-500">Calendar shape</p>
          <h2
            className="mt-1 text-lg font-semibold text-stone-950"
            id="time-blocks-heading"
          >
            Time blocks
          </h2>
        </div>
        {currentPeriod ? (
          <TimeBlockGrid
            blocks={currentBlocks}
            onCreateTimeBlock={createTimeBlock}
          />
        ) : (
          <p className="border border-dashed border-stone-300 px-4 py-5 text-sm text-stone-500">
            Save a weekly plan before adding time blocks.
          </p>
        )}
      </section>

      <section aria-labelledby="weekly-learning-heading" className="space-y-3">
        <div>
          <p className="text-xs font-medium text-stone-500">Learning plan</p>
          <h2
            className="mt-1 text-lg font-semibold text-stone-950"
            id="weekly-learning-heading"
          >
            Learning sessions
          </h2>
        </div>
        <LearningSessionSummaryList
          emptyMessage="No learning sessions are linked to this week."
          linkLabel="Open learning session"
          sessions={currentLearningSessions}
        />
      </section>
    </div>
  );
}

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url);

  return readJson<T>(response);
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
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

function findPlanningPeriod(
  periods: PlanningPeriod[],
  anchorDate: string
): PlanningPeriod | undefined {
  return (
    periods.find(
      (period) => period.startsOn <= anchorDate && anchorDate <= period.endsOn
    ) ?? periods.at(-1)
  );
}

function toCreateWeeklyPlanTask(task: PlannerTask) {
  return {
    taskLinkId: createId(),
    title: task.title,
    projectId: task.projectId,
    dueDate: task.dueDate,
    labels: task.labels,
    description: task.description,
    priority: task.priority
  };
}

function createId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `task-link-${Date.now()}`;
}

function toggleId(ids: string[], id: string): string[] {
  return ids.includes(id)
    ? ids.filter((currentId) => currentId !== id)
    : [...ids, id];
}

function combineDateAndTime(date: string, time: string): string {
  return `${date}T${time}:00.000Z`;
}

function formatHours(minutes: number): string {
  if (minutes === 0) {
    return "0h";
  }

  const hours = minutes / 60;

  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)}h`;
}

function getTodayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Weekly planner failed to load.";
}
