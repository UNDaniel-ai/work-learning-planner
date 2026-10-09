import {
  TaskProviderError,
  type CreateTaskInput,
  type ListTasksFilter,
  type PlannerTask,
  type TaskProvider,
  type UpdateTaskInput
} from "../../domain/tasks/provider";
import { createVikunjaClient } from "./client";
import {
  paginatedTaskSchema,
  vikunjaTaskSchema,
  type VikunjaTask
} from "./schemas";

type FetchLike = typeof fetch;

export type CreateVikunjaTaskProviderInput = {
  baseUrl: string;
  apiToken: string;
  defaultProjectId?: string;
  fetch?: FetchLike;
};

export function createVikunjaTaskProvider(
  input: CreateVikunjaTaskProviderInput
): TaskProvider {
  const client = createVikunjaClient(input);

  return {
    async listTasks(filter?: ListTasksFilter): Promise<PlannerTask[]> {
      const response = await client.get("/tasks", {
        query: {
          per_page: 50,
          format: "markdown",
          filter: toVikunjaFilter(filter)
        }
      });
      const paginatedTasks = parseVikunjaResponse(
        () => paginatedTaskSchema.parse(response),
        "Invalid Vikunja task list response."
      );

      return paginatedTasks.items.map(toPlannerTask);
    },

    async createTask(inputTask: CreateTaskInput): Promise<PlannerTask> {
      const projectId = inputTask.projectId ?? input.defaultProjectId;

      if (!projectId) {
        throw new TaskProviderError(
          "VALIDATION_ERROR",
          "vikunja",
          "A Vikunja project id is required to create a task."
        );
      }

      const response = await client.post(
        `/projects/${encodeURIComponent(projectId)}/tasks`,
        toVikunjaTaskPayload(inputTask),
        {
          query: { format: "markdown" }
        }
      );

      return parseTaskResponse(response);
    },

    async updateTask(
      id: string,
      inputTask: UpdateTaskInput
    ): Promise<PlannerTask> {
      const response = await patchTask(id, toVikunjaTaskPayload(inputTask));

      return parseTaskResponse(response);
    },

    async completeTask(id: string): Promise<PlannerTask> {
      const response = await patchTask(id, { done: true });

      return parseTaskResponse(response);
    },

    async postponeTask(id: string, dueDate: string): Promise<PlannerTask> {
      const response = await patchTask(id, {
        due_date: toVikunjaDateTime(dueDate)
      });

      return parseTaskResponse(response);
    }
  };

  async function patchTask(id: string, body: unknown): Promise<unknown> {
    return client.patch(`/tasks/${encodeURIComponent(id)}`, body, {
      query: { format: "markdown" }
    });
  }
}

function parseTaskResponse(response: unknown): PlannerTask {
  const task = parseVikunjaResponse(
    () => vikunjaTaskSchema.parse(response),
    "Invalid Vikunja task response."
  );

  return toPlannerTask(task);
}

function parseVikunjaResponse<T>(parse: () => T, message: string): T {
  try {
    return parse();
  } catch (error) {
    throw new TaskProviderError(
      "PROVIDER_UNAVAILABLE",
      "vikunja",
      `${message} ${String(error)}`
    );
  }
}

function toPlannerTask(task: VikunjaTask): PlannerTask {
  return compactTask({
    id: String(task.id),
    title: task.title,
    status: task.done ? "completed" : "open",
    projectId:
      task.project_id === undefined || task.project_id === null
        ? undefined
        : String(task.project_id),
    dueDate: toDateOnly(task.due_date),
    labels: (task.labels ?? []).map((label) => label.title),
    description: task.description ?? undefined,
    priority: task.priority ?? undefined,
    createdAt: task.created,
    updatedAt: task.updated,
    completedAt: task.done ? (task.done_at ?? undefined) : undefined
  });
}

function toVikunjaTaskPayload(input: CreateTaskInput | UpdateTaskInput) {
  const payload: Record<string, unknown> = {};

  if (input.title !== undefined) {
    const title = input.title.trim();

    if (!title) {
      throw new TaskProviderError(
        "VALIDATION_ERROR",
        "vikunja",
        "A non-empty task title is required."
      );
    }

    payload.title = title;
  }

  if (input.description !== undefined) {
    payload.description = input.description;
  }

  if (input.dueDate !== undefined) {
    payload.due_date = toVikunjaDateTime(input.dueDate);
  }

  if (input.priority !== undefined) {
    payload.priority = input.priority;
  }

  return payload;
}

function toVikunjaFilter(filter?: ListTasksFilter): string | undefined {
  if (!filter?.status) {
    return undefined;
  }

  return filter.status === "open" ? "done = false" : "done = true";
}

function toVikunjaDateTime(dateOnly: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
    throw new TaskProviderError(
      "VALIDATION_ERROR",
      "vikunja",
      `Vikunja due date must use YYYY-MM-DD: ${dateOnly}`
    );
  }

  return `${dateOnly}T00:00:00.000Z`;
}

function toDateOnly(value: string | null | undefined): string | undefined {
  return value ? value.slice(0, 10) : undefined;
}

function compactTask(task: PlannerTask): PlannerTask {
  return Object.fromEntries(
    Object.entries(task).filter(([, value]) => value !== undefined)
  ) as PlannerTask;
}
