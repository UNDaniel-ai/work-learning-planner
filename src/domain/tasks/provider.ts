export type TaskStatus = "open" | "completed";

export type TaskProviderErrorCode =
  | "TASK_NOT_FOUND"
  | "VALIDATION_ERROR"
  | "PROVIDER_UNAVAILABLE";

export type PlannerTask = {
  id: string;
  title: string;
  status: TaskStatus;
  projectId?: string;
  dueDate?: string;
  labels: string[];
  description?: string;
  priority?: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
};

export type CreateTaskInput = {
  title: string;
  projectId?: string;
  dueDate?: string;
  labels?: string[];
  description?: string;
  priority?: number;
};

export type UpdateTaskInput = Partial<
  Pick<
    PlannerTask,
    "title" | "projectId" | "dueDate" | "labels" | "description" | "priority"
  >
>;

export type ListTasksFilter = {
  status?: TaskStatus;
};

export interface TaskProvider {
  listTasks(filter?: ListTasksFilter): Promise<PlannerTask[]>;
  createTask(input: CreateTaskInput): Promise<PlannerTask>;
  updateTask(id: string, input: UpdateTaskInput): Promise<PlannerTask>;
  completeTask(id: string): Promise<PlannerTask>;
  postponeTask(id: string, dueDate: string): Promise<PlannerTask>;
}

export class TaskProviderError extends Error {
  readonly code: TaskProviderErrorCode;
  readonly provider: string;

  constructor(
    code: TaskProviderErrorCode,
    provider: string,
    message: string
  ) {
    super(message);
    this.name = "TaskProviderError";
    this.code = code;
    this.provider = provider;
  }
}
