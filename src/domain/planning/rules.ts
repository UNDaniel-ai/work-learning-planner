import type {
  EntityId,
  Goal,
  GoalHorizon,
  LearningTopic,
  PlanningPeriod,
  Review,
  ReviewType,
  TimeBlock
} from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

type CreateGoalInput = {
  id: EntityId;
  areaId: EntityId;
  title: string;
  horizon: GoalHorizon;
  createdAt: string;
};

type CreateLearningTopicInput = {
  id: EntityId;
  areaId: EntityId;
  title: string;
  progressPercent: number;
  createdAt: string;
};

type CreateWeeklyPlanningPeriodInput = {
  id: EntityId;
  anchorDate: string;
  focusGoalIds?: EntityId[];
  taskLinkIds?: EntityId[];
};

type CreateTimeBlockInput = {
  id: EntityId;
  periodId: EntityId;
  areaId: EntityId;
  startsAt: string;
  endsAt: string;
  taskLinkId?: EntityId;
  actualMinutes?: number;
  note?: string;
};

type CreateReviewInput = {
  id: EntityId;
  periodId: EntityId;
  type: ReviewType;
  wins?: string[];
  misses?: string[];
  adjustments?: string[];
  plannedMinutes: number;
  actualMinutes: number;
  createdAt: string;
};

export function createGoal(input: CreateGoalInput): Goal {
  return {
    id: input.id,
    areaId: input.areaId,
    title: normalizeRequiredTitle(input.title),
    horizon: input.horizon,
    status: "active",
    createdAt: input.createdAt
  };
}

export function createLearningTopic(
  input: CreateLearningTopicInput
): LearningTopic {
  assertProgressPercent(input.progressPercent);

  return {
    id: input.id,
    areaId: input.areaId,
    title: normalizeRequiredTitle(input.title),
    progressPercent: input.progressPercent,
    status: "active",
    createdAt: input.createdAt
  };
}

export function createWeeklyPlanningPeriod(
  input: CreateWeeklyPlanningPeriodInput
): PlanningPeriod {
  const anchorDate = parseDateOnly(input.anchorDate);
  const dayOfWeek = anchorDate.getUTCDay();
  const daysSinceMonday = (dayOfWeek + 6) % 7;
  const startsOn = new Date(anchorDate.getTime() - daysSinceMonday * DAY_MS);
  const endsOn = new Date(startsOn.getTime() + 6 * DAY_MS);

  return {
    id: input.id,
    type: "week",
    startsOn: formatDateOnly(startsOn),
    endsOn: formatDateOnly(endsOn),
    focusGoalIds: [...(input.focusGoalIds ?? [])],
    taskLinkIds: [...(input.taskLinkIds ?? [])]
  };
}

export function createTimeBlock(input: CreateTimeBlockInput): TimeBlock {
  const startsAt = parseDateTime(input.startsAt, "startsAt");
  const endsAt = parseDateTime(input.endsAt, "endsAt");

  if (endsAt.getTime() <= startsAt.getTime()) {
    throw new Error("Time block endsAt must be after startsAt.");
  }

  const durationMinutes = Math.round(
    (endsAt.getTime() - startsAt.getTime()) / MINUTE_MS
  );

  return {
    id: input.id,
    periodId: input.periodId,
    areaId: input.areaId,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    durationMinutes,
    taskLinkId: input.taskLinkId,
    actualMinutes: input.actualMinutes,
    note: input.note
  };
}

export function addTimeBlock(
  period: PlanningPeriod,
  existingBlocks: TimeBlock[],
  nextBlock: TimeBlock
): TimeBlock[] {
  assertBlockBelongsToPeriod(period, nextBlock);
  assertBlockInsidePeriod(period, nextBlock);

  for (const existingBlock of existingBlocks) {
    assertBlockBelongsToPeriod(period, existingBlock);

    if (timeBlocksOverlap(existingBlock, nextBlock)) {
      throw new Error(
        `Time block ${nextBlock.id} overlaps with ${existingBlock.id}.`
      );
    }
  }

  return [...existingBlocks, nextBlock].sort(
    (left, right) =>
      parseDateTime(left.startsAt, "startsAt").getTime() -
      parseDateTime(right.startsAt, "startsAt").getTime()
  );
}

export function createReview(input: CreateReviewInput): Review {
  assertNonNegativeMinutes(input.plannedMinutes, "plannedMinutes");
  assertNonNegativeMinutes(input.actualMinutes, "actualMinutes");

  return {
    id: input.id,
    periodId: input.periodId,
    type: input.type,
    wins: [...(input.wins ?? [])],
    misses: [...(input.misses ?? [])],
    adjustments: [...(input.adjustments ?? [])],
    plannedMinutes: input.plannedMinutes,
    actualMinutes: input.actualMinutes,
    varianceMinutes: input.actualMinutes - input.plannedMinutes,
    createdAt: input.createdAt
  };
}

function normalizeRequiredTitle(title: string): string {
  const normalized = title.trim();

  if (!normalized) {
    throw new Error("A non-empty title is required.");
  }

  return normalized;
}

function assertProgressPercent(progressPercent: number): void {
  if (
    !Number.isFinite(progressPercent) ||
    progressPercent < 0 ||
    progressPercent > 100
  ) {
    throw new Error("Learning topic progressPercent must be between 0 and 100.");
  }
}

function assertNonNegativeMinutes(value: number, fieldName: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${fieldName} must be a non-negative number of minutes.`);
  }
}

function assertBlockBelongsToPeriod(
  period: PlanningPeriod,
  block: TimeBlock
): void {
  if (block.periodId !== period.id) {
    throw new Error(`Time block ${block.id} belongs to a different period.`);
  }
}

function assertBlockInsidePeriod(
  period: PlanningPeriod,
  block: TimeBlock
): void {
  const periodStartsAt = parseDateOnly(period.startsOn).getTime();
  const periodEndsAtExclusive = parseDateOnly(period.endsOn).getTime() + DAY_MS;
  const blockStartsAt = parseDateTime(block.startsAt, "startsAt").getTime();
  const blockEndsAt = parseDateTime(block.endsAt, "endsAt").getTime();

  if (
    blockStartsAt < periodStartsAt ||
    blockEndsAt > periodEndsAtExclusive
  ) {
    throw new Error(`Time block ${block.id} is outside the planning period.`);
  }
}

function timeBlocksOverlap(left: TimeBlock, right: TimeBlock): boolean {
  const leftStartsAt = parseDateTime(left.startsAt, "startsAt").getTime();
  const leftEndsAt = parseDateTime(left.endsAt, "endsAt").getTime();
  const rightStartsAt = parseDateTime(right.startsAt, "startsAt").getTime();
  const rightEndsAt = parseDateTime(right.endsAt, "endsAt").getTime();

  return leftStartsAt < rightEndsAt && rightStartsAt < leftEndsAt;
}

function parseDateOnly(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`Invalid date: ${value}`);
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${value}`);
  }

  return date;
}

function parseDateTime(value: string, fieldName: string): Date {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid ${fieldName}: ${value}`);
  }

  return date;
}

function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}
