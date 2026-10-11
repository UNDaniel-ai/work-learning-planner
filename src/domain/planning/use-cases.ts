import type {
  PlanningRepository,
  SyncCursor
} from "../../lib/db/repositories";
import type {
  CreateTaskInput,
  TaskProvider
} from "../tasks/provider";
import { TaskProviderError } from "../tasks/provider";
import {
  addTimeBlock,
  createGoal,
  createLearningTopic,
  createReview,
  createTimeBlock,
  createWeeklyPlanningPeriod
} from "./rules";
import type {
  EntityId,
  Goal,
  GoalHorizon,
  LearningTopic,
  PlanningPeriod,
  Review,
  ReviewType,
  TaskLink,
  TaskProviderName,
  TimeBlock
} from "./types";

export type PlanningUseCaseErrorCode =
  | "PLANNING_PERIOD_NOT_FOUND"
  | "TIME_BLOCK_NOT_FOUND"
  | "TASK_PROVIDER_ERROR";

export class PlanningUseCaseError extends Error {
  readonly code: PlanningUseCaseErrorCode;
  readonly provider?: string;
  readonly cause?: unknown;

  constructor(
    code: PlanningUseCaseErrorCode,
    message: string,
    options: { provider?: string; cause?: unknown } = {}
  ) {
    super(message);
    this.name = "PlanningUseCaseError";
    this.code = code;
    this.provider = options.provider;
    this.cause = options.cause;
  }
}

export type CreatePlanningUseCasesInput = {
  repository: PlanningRepository;
  taskProvider: TaskProvider;
  taskProviderName?: TaskProviderName;
  now?: () => string;
};

export type CreateGoalUseCaseInput = {
  id: EntityId;
  areaId: EntityId;
  title: string;
  horizon: GoalHorizon;
};

export type CreateLearningTopicUseCaseInput = {
  id: EntityId;
  areaId: EntityId;
  title: string;
  progressPercent: number;
};

export type CreateWeeklyPlanTaskInput = CreateTaskInput & {
  taskLinkId: EntityId;
};

export type CreateWeeklyPlanUseCaseInput = {
  id: EntityId;
  anchorDate: string;
  focusGoalIds?: EntityId[];
  tasks?: CreateWeeklyPlanTaskInput[];
};

export type ScheduleTimeBlockUseCaseInput = {
  id: EntityId;
  periodId: EntityId;
  areaId: EntityId;
  startsAt: string;
  endsAt: string;
  taskLinkId?: EntityId;
  actualMinutes?: number;
  note?: string;
};

export type RecordTimeBlockActualUseCaseInput = {
  id: EntityId;
  actualMinutes: number;
};

export type RecordReviewUseCaseInput = {
  id: EntityId;
  periodId: EntityId;
  type: ReviewType;
  date?: string;
  wins?: string[];
  misses?: string[];
  adjustments?: string[];
  actualMinutes?: number;
};

export function createPlanningUseCases(input: CreatePlanningUseCasesInput) {
  const repository = input.repository;
  const taskProvider = input.taskProvider;
  const taskProviderName = input.taskProviderName ?? "vikunja";
  const now = input.now ?? (() => new Date().toISOString());

  return {
    async createGoal(goalInput: CreateGoalUseCaseInput): Promise<Goal> {
      const goal = createGoal({
        ...goalInput,
        createdAt: now()
      });

      await repository.createGoal(goal);

      return goal;
    },

    async createLearningTopic(
      topicInput: CreateLearningTopicUseCaseInput
    ): Promise<LearningTopic> {
      const topic = createLearningTopic({
        ...topicInput,
        createdAt: now()
      });

      await repository.createLearningTopic(topic);

      return topic;
    },

    async createWeeklyPlan(
      planInput: CreateWeeklyPlanUseCaseInput
    ): Promise<PlanningPeriod> {
      const period = createWeeklyPlanningPeriod({
        id: planInput.id,
        anchorDate: planInput.anchorDate,
        focusGoalIds: planInput.focusGoalIds
      });
      const taskLinks = await createTaskLinks(
        planInput.tasks ?? [],
        taskProvider,
        taskProviderName
      );
      const periodWithTasks = {
        ...period,
        taskLinkIds: taskLinks.map((taskLink) => taskLink.id)
      };

      for (const taskLink of taskLinks) {
        await repository.createTaskLink(taskLink);
      }

      await repository.createPlanningPeriod(periodWithTasks);

      return periodWithTasks;
    },

    async scheduleTimeBlock(
      blockInput: ScheduleTimeBlockUseCaseInput
    ): Promise<TimeBlock> {
      const period = await getPlanningPeriodOrThrow(
        repository,
        blockInput.periodId
      );
      const existingBlocks = await repository.listTimeBlocksForPeriod(period.id);
      const timeBlock = createTimeBlock(blockInput);

      addTimeBlock(period, existingBlocks, timeBlock);
      await repository.createTimeBlock(timeBlock);

      return timeBlock;
    },

    async recordTimeBlockActual(
      actualInput: RecordTimeBlockActualUseCaseInput
    ): Promise<TimeBlock> {
      const timeBlock = await repository.getTimeBlock(actualInput.id);

      if (!timeBlock) {
        throw new PlanningUseCaseError(
          "TIME_BLOCK_NOT_FOUND",
          `Time block not found: ${actualInput.id}`
        );
      }

      assertNonNegativeInteger(actualInput.actualMinutes, "actualMinutes");
      const updatedTimeBlock = {
        ...timeBlock,
        actualMinutes: actualInput.actualMinutes
      };

      await repository.updateTimeBlock(updatedTimeBlock);

      return updatedTimeBlock;
    },

    async recordReview(
      reviewInput: RecordReviewUseCaseInput
    ): Promise<Review> {
      const period = await getPlanningPeriodOrThrow(
        repository,
        reviewInput.periodId
      );
      const timeBlocks = await repository.listTimeBlocksForPeriod(period.id);
      const reviewTimeBlocks =
        reviewInput.type === "daily" && reviewInput.date
          ? timeBlocks.filter(
              (timeBlock) => timeBlock.startsAt.slice(0, 10) === reviewInput.date
            )
          : timeBlocks;
      const plannedMinutes = sum(reviewTimeBlocks, (timeBlock) =>
        timeBlock.durationMinutes
      );
      const actualMinutes =
        reviewInput.actualMinutes ??
        sum(reviewTimeBlocks, (timeBlock) => timeBlock.actualMinutes ?? 0);
      const review = createReview({
        id: reviewInput.id,
        periodId: reviewInput.periodId,
        type: reviewInput.type,
        wins: reviewInput.wins,
        misses: reviewInput.misses,
        adjustments: reviewInput.adjustments,
        plannedMinutes,
        actualMinutes,
        createdAt: now()
      });

      await repository.createReview(review);

      return review;
    },

    async exportPlanningData() {
      return repository.exportPlanningData();
    },

    async upsertSyncCursor(syncCursor: SyncCursor): Promise<void> {
      await repository.upsertSyncCursor(syncCursor);
    }
  };
}

export type PlanningUseCases = ReturnType<typeof createPlanningUseCases>;

async function createTaskLinks(
  tasks: CreateWeeklyPlanTaskInput[],
  taskProvider: TaskProvider,
  taskProviderName: TaskProviderName
): Promise<TaskLink[]> {
  const taskLinks: TaskLink[] = [];

  for (const taskInput of tasks) {
    try {
      const task = await taskProvider.createTask({
        title: taskInput.title,
        projectId: taskInput.projectId,
        dueDate: taskInput.dueDate,
        labels: taskInput.labels,
        description: taskInput.description,
        priority: taskInput.priority
      });

      taskLinks.push({
        id: taskInput.taskLinkId,
        provider: taskProviderName,
        externalTaskId: task.id,
        titleSnapshot: task.title
      });
    } catch (error) {
      throw toUseCaseProviderError(error, taskProviderName);
    }
  }

  return taskLinks;
}

async function getPlanningPeriodOrThrow(
  repository: PlanningRepository,
  periodId: EntityId
): Promise<PlanningPeriod> {
  const period = await repository.getPlanningPeriod(periodId);

  if (!period) {
    throw new PlanningUseCaseError(
      "PLANNING_PERIOD_NOT_FOUND",
      `Planning period not found: ${periodId}`
    );
  }

  return period;
}

function toUseCaseProviderError(
  error: unknown,
  fallbackProvider: TaskProviderName
): PlanningUseCaseError {
  if (error instanceof TaskProviderError) {
    return new PlanningUseCaseError(
      "TASK_PROVIDER_ERROR",
      error.message,
      {
        provider: error.provider,
        cause: error
      }
    );
  }

  return new PlanningUseCaseError(
    "TASK_PROVIDER_ERROR",
    "Task provider operation failed.",
    {
      provider: fallbackProvider,
      cause: error
    }
  );
}

function sum<T>(items: T[], select: (item: T) => number): number {
  return items.reduce((total, item) => total + select(item), 0);
}

function assertNonNegativeInteger(value: number, fieldName: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${fieldName} must be a non-negative integer.`);
  }
}
