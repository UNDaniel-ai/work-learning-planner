"use client";

import { useEffect, useState } from "react";
import type { Goal, LearningTopic } from "../domain/planning/types";
import {
  GoalPicker,
  type CreateGoalFormInput,
  type CreateLearningTopicFormInput
} from "./goal-picker";

type GoalsResponse = {
  goals: Goal[];
  learningTopics: LearningTopic[];
};

export function GoalsWorkspace() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [learningTopics, setLearningTopics] = useState<LearningTopic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    let isActive = true;

    async function loadGoals() {
      try {
        const data = await getJson<GoalsResponse>("/api/planning/goals");

        if (!isActive) {
          return;
        }

        setGoals(data.goals);
        setLearningTopics(data.learningTopics);
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

    void loadGoals();

    return () => {
      isActive = false;
    };
  }, []);

  async function createGoal(input: CreateGoalFormInput) {
    const goal = await postJson<Goal>("/api/planning/goals", {
      areaId: "area-work",
      title: input.title,
      horizon: input.horizon
    });

    setGoals((currentGoals) => [...currentGoals, goal]);
  }

  async function createLearningTopic(input: CreateLearningTopicFormInput) {
    const topic = await postJson<LearningTopic>(
      "/api/planning/learning-topics",
      {
        areaId: "area-learning",
        title: input.title
      }
    );

    setLearningTopics((currentTopics) => [...currentTopics, topic]);
  }

  if (isLoading) {
    return (
      <p className="border border-stone-200 bg-white/60 px-4 py-5 text-sm text-stone-500">
        Loading goals...
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {error ? (
        <p
          className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      <GoalPicker
        goals={goals}
        learningTopics={learningTopics}
        onCreateGoal={createGoal}
        onCreateLearningTopic={createLearningTopic}
      />
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

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Planning data failed to load.";
}
