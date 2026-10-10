"use client";

import { BookOpen, Flag, Plus } from "lucide-react";
import { useState, type FormEvent } from "react";
import type {
  Goal,
  GoalHorizon,
  LearningTopic
} from "../domain/planning/types";

export type CreateGoalFormInput = {
  title: string;
  horizon: GoalHorizon;
};

export type CreateLearningTopicFormInput = {
  title: string;
};

type GoalPickerProps = {
  goals: Goal[];
  learningTopics: LearningTopic[];
  onCreateGoal: (input: CreateGoalFormInput) => Promise<void> | void;
  onCreateLearningTopic: (
    input: CreateLearningTopicFormInput
  ) => Promise<void> | void;
};

export function GoalPicker({
  goals,
  learningTopics,
  onCreateGoal,
  onCreateLearningTopic
}: GoalPickerProps) {
  const [goalTitle, setGoalTitle] = useState("");
  const [goalHorizon, setGoalHorizon] = useState<GoalHorizon>("quarter");
  const [learningTopic, setLearningTopic] = useState("");

  function submitGoal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = goalTitle.trim();

    if (!title) {
      return;
    }

    void onCreateGoal({ title, horizon: goalHorizon });
    setGoalTitle("");
  }

  function submitLearningTopic(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = learningTopic.trim();

    if (!title) {
      return;
    }

    void onCreateLearningTopic({ title });
    setLearningTopic("");
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section aria-labelledby="goals-picker-heading" className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
            <Flag aria-hidden="true" size={17} />
          </span>
          <div>
            <p className="text-xs font-medium text-stone-500">Work</p>
            <h2
              className="text-lg font-semibold text-stone-950"
              id="goals-picker-heading"
            >
              Goals
            </h2>
          </div>
        </div>

        <div className="space-y-2">
          {goals.length > 0 ? (
            goals.map((goal) => (
              <div
                className="border border-stone-200 bg-white/70 px-4 py-3"
                key={goal.id}
              >
                <p className="text-sm font-medium text-stone-950">
                  {goal.title}
                </p>
                <p className="mt-1 text-xs text-stone-500">{goal.horizon}</p>
              </div>
            ))
          ) : (
            <p className="border border-dashed border-stone-300 px-4 py-3 text-sm text-stone-500">
              No goals yet.
            </p>
          )}
        </div>

        <form
          className="space-y-3 border-t border-stone-200 pt-4"
          onSubmit={submitGoal}
        >
          <div>
            <label
              className="text-xs font-medium text-stone-600"
              htmlFor="goal-title"
            >
              Goal title
            </label>
            <input
              className="mt-1.5 h-10 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm text-stone-950 outline-none placeholder:text-stone-400 focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
              id="goal-title"
              onChange={(event) => setGoalTitle(event.target.value)}
              placeholder="Ship the planner MVP"
              value={goalTitle}
            />
          </div>
          <div>
            <label
              className="text-xs font-medium text-stone-600"
              htmlFor="goal-horizon"
            >
              Goal horizon
            </label>
            <select
              className="mt-1.5 h-10 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm text-stone-950 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
              id="goal-horizon"
              onChange={(event) =>
                setGoalHorizon(event.target.value as GoalHorizon)
              }
              value={goalHorizon}
            >
              <option value="quarter">Quarter</option>
              <option value="month">Month</option>
              <option value="week">Week</option>
            </select>
          </div>
          <button
            className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-stone-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-stone-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
            type="submit"
          >
            <Plus aria-hidden="true" size={16} />
            Create goal
          </button>
        </form>
      </section>

      <section aria-labelledby="learning-picker-heading" className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
            <BookOpen aria-hidden="true" size={17} />
          </span>
          <div>
            <p className="text-xs font-medium text-stone-500">Learning</p>
            <h2
              className="text-lg font-semibold text-stone-950"
              id="learning-picker-heading"
            >
              Learning topics
            </h2>
          </div>
        </div>

        <div className="space-y-2">
          {learningTopics.length > 0 ? (
            learningTopics.map((topic) => (
              <div
                className="border border-stone-200 bg-white/70 px-4 py-3"
                key={topic.id}
              >
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-medium text-stone-950">
                    {topic.title}
                  </p>
                  <span className="text-xs font-medium text-amber-700">
                    {topic.progressPercent}%
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-stone-100">
                  <div
                    className="h-full rounded-full bg-amber-500"
                    style={{ width: `${topic.progressPercent}%` }}
                  />
                </div>
              </div>
            ))
          ) : (
            <p className="border border-dashed border-stone-300 px-4 py-3 text-sm text-stone-500">
              No learning topics yet.
            </p>
          )}
        </div>

        <form
          className="space-y-3 border-t border-stone-200 pt-4"
          onSubmit={submitLearningTopic}
        >
          <div>
            <label
              className="text-xs font-medium text-stone-600"
              htmlFor="learning-topic"
            >
              Learning topic
            </label>
            <input
              className="mt-1.5 h-10 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm text-stone-950 outline-none placeholder:text-stone-400 focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
              id="learning-topic"
              onChange={(event) => setLearningTopic(event.target.value)}
              placeholder="TypeScript testing"
              value={learningTopic}
            />
          </div>
          <button
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-stone-800 transition hover:border-stone-400 hover:text-stone-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
            type="submit"
          >
            <Plus aria-hidden="true" size={16} />
            Add learning topic
          </button>
        </form>
      </section>
    </div>
  );
}
