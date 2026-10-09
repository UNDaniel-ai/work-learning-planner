import {
  TaskProviderError,
  type CreateTaskInput,
  type ListTasksFilter,
  type PlannerTask,
  type TaskProvider,
  type UpdateTaskInput
} from "../../domain/tasks/provider";

type MemoryTaskProviderOptions = {
  now?: () => string;
};

export function createMemoryTaskProvider(
  options: MemoryTaskProviderOptions = {}
): TaskProvider {
  const tasks = new Map<string, PlannerTask>();
  const now = options.now ?? (() => new Date().toISOString());
  let nextId = 1;

  async function createTask(input: CreateTaskInput): Promise<PlannerTask> {
    const timestamp = now();
    const task: PlannerTask = withOptionalTaskFields({
      id: `task-${nextId++}`,
      title: normalizeTaskTitle(input.title),
      status: "open",
      projectId: input.projectId,
      dueDate: normalizeOptionalDate(input.dueDate),
      labels: [...(input.labels ?? [])],
      description: input.description,
      priority: input.priority,
      createdAt: timestamp,
      updatedAt: timestamp
    });

    tasks.set(task.id, task);

    return cloneTask(task);
  }

  async function listTasks(
    filter: ListTasksFilter = {}
  ): Promise<PlannerTask[]> {
    const listedTasks = [...tasks.values()].filter((task) =>
      filter.status ? task.status === filter.status : true
    );

    return listedTasks.map(cloneTask);
  }

  async function updateTask(
    id: string,
    input: UpdateTaskInput
  ): Promise<PlannerTask> {
    const existingTask = getTaskOrThrow(id);
    const updatedTask: PlannerTask = withOptionalTaskFields({
      ...existingTask,
      title:
        input.title === undefined
          ? existingTask.title
          : normalizeTaskTitle(input.title),
      projectId:
        input.projectId === undefined ? existingTask.projectId : input.projectId,
      dueDate:
        input.dueDate === undefined
          ? existingTask.dueDate
          : normalizeOptionalDate(input.dueDate),
      labels: input.labels === undefined ? existingTask.labels : [...input.labels],
      description:
        input.description === undefined
          ? existingTask.description
          : input.description,
      priority: input.priority === undefined ? existingTask.priority : input.priority,
      updatedAt: now()
    });

    tasks.set(id, updatedTask);

    return cloneTask(updatedTask);
  }

  async function completeTask(id: string): Promise<PlannerTask> {
    const existingTask = getTaskOrThrow(id);
    const timestamp = now();
    const completedTask: PlannerTask = withOptionalTaskFields({
      ...existingTask,
      status: "completed",
      completedAt: timestamp,
      updatedAt: timestamp
    });

    tasks.set(id, completedTask);

    return cloneTask(completedTask);
  }

  async function postponeTask(
    id: string,
    dueDate: string
  ): Promise<PlannerTask> {
    return updateTask(id, { dueDate });
  }

  function getTaskOrThrow(id: string): PlannerTask {
    const task = tasks.get(id);

    if (!task) {
      throw new TaskProviderError(
        "TASK_NOT_FOUND",
        "memory",
        `Task not found: ${id}`
      );
    }

    return task;
  }

  return {
    listTasks,
    createTask,
    updateTask,
    completeTask,
    postponeTask
  };
}

function normalizeTaskTitle(title: string): string {
  const normalized = title.trim();

  if (!normalized) {
    throw new TaskProviderError(
      "VALIDATION_ERROR",
      "memory",
      "A non-empty task title is required."
    );
  }

  return normalized;
}

function normalizeOptionalDate(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new TaskProviderError(
      "VALIDATION_ERROR",
      "memory",
      `Task dueDate must use YYYY-MM-DD: ${value}`
    );
  }

  return value;
}

function cloneTask(task: PlannerTask): PlannerTask {
  return {
    ...task,
    labels: [...task.labels]
  };
}

function withOptionalTaskFields(task: PlannerTask): PlannerTask {
  const compactTask: PlannerTask = {
    id: task.id,
    title: task.title,
    status: task.status,
    labels: [...task.labels],
    createdAt: task.createdAt,
    updatedAt: task.updatedAt
  };

  if (task.projectId !== undefined) {
    compactTask.projectId = task.projectId;
  }

  if (task.dueDate !== undefined) {
    compactTask.dueDate = task.dueDate;
  }

  if (task.description !== undefined) {
    compactTask.description = task.description;
  }

  if (task.priority !== undefined) {
    compactTask.priority = task.priority;
  }

  if (task.completedAt !== undefined) {
    compactTask.completedAt = task.completedAt;
  }

  return compactTask;
}
