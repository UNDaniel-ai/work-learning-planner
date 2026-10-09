export type EntityId = string;

export type AreaKind = "work" | "learning";

export type EntityStatus = "active" | "completed" | "archived";

export type GoalHorizon = "quarter" | "month" | "week";

export type PlanningPeriodType = "week" | "day";

export type ReviewType = "daily" | "weekly";

export type Area = {
  id: EntityId;
  name: string;
  kind: AreaKind;
  color?: string;
};

export type Goal = {
  id: EntityId;
  areaId: EntityId;
  title: string;
  horizon: GoalHorizon;
  status: EntityStatus;
  createdAt: string;
};

export type LearningTopic = {
  id: EntityId;
  areaId: EntityId;
  title: string;
  progressPercent: number;
  status: EntityStatus;
  createdAt: string;
};

export type PlanningPeriod = {
  id: EntityId;
  type: PlanningPeriodType;
  startsOn: string;
  endsOn: string;
  focusGoalIds: EntityId[];
  taskLinkIds: EntityId[];
};

export type TimeBlock = {
  id: EntityId;
  periodId: EntityId;
  areaId: EntityId;
  startsAt: string;
  endsAt: string;
  durationMinutes: number;
  taskLinkId?: EntityId;
  actualMinutes?: number;
  note?: string;
};

export type Review = {
  id: EntityId;
  periodId: EntityId;
  type: ReviewType;
  wins: string[];
  misses: string[];
  adjustments: string[];
  plannedMinutes: number;
  actualMinutes: number;
  varianceMinutes: number;
  createdAt: string;
};

export type TaskProviderName = "vikunja";

export type TaskLink = {
  id: EntityId;
  provider: TaskProviderName;
  externalTaskId: string;
  titleSnapshot?: string;
};
