import type {
  AIGuidance,
  AICoachBoundary,
  AICoachMode,
  AICoachRequestedAction,
  EvidenceItem,
  EvidenceKind,
  EvidenceResult,
  EntityId,
  KnowledgeCard,
  KnowledgeMaturity,
  LearningModule,
  LearningSource,
  LearningSourceKind,
  LearningTrack,
  StudySession,
  StudySessionStatus
} from "./types";

const REVIEW_INTERVAL_DAYS = [1, 3, 7, 14] as const;
const DAY_MS = 24 * 60 * 60 * 1000;

export type CreateLearningSourceInput = {
  id: EntityId;
  title: string;
  kind: LearningSourceKind;
  url: string;
  repositoryUrl?: string;
  revision?: string;
  license?: string;
  aiGuidance: AIGuidance;
  summary?: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateLearningTrackInput = {
  id: EntityId;
  learningTopicId?: EntityId;
  sourceId: EntityId;
  title: string;
  objective: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateLearningModuleInput = {
  id: EntityId;
  trackId: EntityId;
  title: string;
  sequence: number;
  expectedOutcome: string;
  acceptanceCriteria: string[];
  markdownPath?: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateStudySessionInput = {
  id: EntityId;
  moduleId: EntityId;
  planningPeriodId?: EntityId;
  timeBlockId?: EntityId;
  taskLinkId?: EntityId;
  question: string;
  preUnderstanding: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateEvidenceItemInput = {
  id: EntityId;
  sessionId: EntityId;
  kind: EvidenceKind;
  title: string;
  summary: string;
  reference: string;
  result: EvidenceResult;
  markdownPath?: string;
  createdAt: string;
};

export type CreateKnowledgeCardInput = {
  id: EntityId;
  trackId: EntityId;
  moduleId: EntityId;
  title: string;
  slug: string;
  sourceIds: EntityId[];
  evidenceIds: EntityId[];
  relatedCardIds?: EntityId[];
  maturity?: KnowledgeCard["maturity"];
  confidence: number;
  summary: string;
  markdownPath?: string;
  createdAt: string;
  updatedAt: string;
};

export type CalculateNextReviewInput = {
  now: string;
  ease: number;
  reviewCount: number;
  lapseCount: number;
};

export function createLearningSource(
  input: CreateLearningSourceInput
): LearningSource {
  const title = normalizeRequiredText(input.title, "title");
  assertHttpUrl(input.url, "url");

  if (input.repositoryUrl) {
    assertHttpUrl(input.repositoryUrl, "repositoryUrl");
  }

  return {
    id: input.id,
    title,
    kind: input.kind,
    url: input.url,
    repositoryUrl: input.repositoryUrl,
    revision: normalizeOptionalText(input.revision),
    license: normalizeOptionalText(input.license),
    aiGuidance: input.aiGuidance,
    summary: normalizeOptionalText(input.summary),
    status: "active",
    createdAt: input.createdAt,
    updatedAt: input.updatedAt
  };
}

export function createLearningTrack(
  input: CreateLearningTrackInput
): LearningTrack {
  return {
    id: input.id,
    learningTopicId: input.learningTopicId,
    sourceId: normalizeRequiredText(input.sourceId, "sourceId"),
    title: normalizeRequiredText(input.title, "title"),
    objective: normalizeRequiredText(input.objective, "objective"),
    status: "active",
    createdAt: input.createdAt,
    updatedAt: input.updatedAt
  };
}

export function createLearningModule(
  input: CreateLearningModuleInput
): LearningModule {
  assertPositiveInteger(input.sequence, "sequence");

  if (input.acceptanceCriteria.length === 0) {
    throw new Error("At least one acceptance criterion is required.");
  }

  return {
    id: input.id,
    trackId: normalizeRequiredText(input.trackId, "trackId"),
    title: normalizeRequiredText(input.title, "title"),
    sequence: input.sequence,
    status: "not_started",
    expectedOutcome: normalizeRequiredText(
      input.expectedOutcome,
      "expectedOutcome"
    ),
    acceptanceCriteria: input.acceptanceCriteria.map((criterion) =>
      normalizeRequiredText(criterion, "acceptanceCriteria")
    ),
    markdownPath: normalizeOptionalText(input.markdownPath),
    createdAt: input.createdAt,
    updatedAt: input.updatedAt
  };
}

export function createStudySession(
  input: CreateStudySessionInput
): StudySession {
  return {
    id: input.id,
    moduleId: normalizeRequiredText(input.moduleId, "moduleId"),
    planningPeriodId: input.planningPeriodId,
    timeBlockId: input.timeBlockId,
    taskLinkId: input.taskLinkId,
    status: "planned",
    question: normalizeRequiredText(input.question, "question"),
    preUnderstanding: normalizeRequiredText(
      input.preUnderstanding,
      "preUnderstanding"
    ),
    createdAt: input.createdAt,
    updatedAt: input.updatedAt
  };
}

export function transitionStudySession(
  session: StudySession,
  nextStatus: StudySessionStatus,
  updatedAt = session.updatedAt
): StudySession {
  const allowedTransitions: Record<
    StudySessionStatus,
    StudySessionStatus[]
  > = {
    planned: ["active", "blocked"],
    active: ["completed", "blocked"],
    blocked: ["active"],
    completed: []
  };

  if (!allowedTransitions[session.status].includes(nextStatus)) {
    throw new Error(
      `Study session transition from ${session.status} to ${nextStatus} is not allowed.`
    );
  }

  return {
    ...session,
    status: nextStatus,
    updatedAt
  };
}

export function createEvidenceItem(
  input: CreateEvidenceItemInput
): EvidenceItem {
  return {
    id: input.id,
    sessionId: normalizeRequiredText(input.sessionId, "sessionId"),
    kind: input.kind,
    title: normalizeRequiredText(input.title, "title"),
    summary: normalizeRequiredText(input.summary, "summary"),
    reference: normalizeRequiredText(input.reference, "reference"),
    result: input.result,
    markdownPath: normalizeOptionalText(input.markdownPath),
    createdAt: input.createdAt
  };
}

export function createKnowledgeCard(
  input: CreateKnowledgeCardInput
): KnowledgeCard {
  if (input.sourceIds.length === 0) {
    throw new Error("At least one source is required for a knowledge card.");
  }

  if (input.evidenceIds.length === 0) {
    throw new Error("At least one evidence item is required for a knowledge card.");
  }

  if (!Number.isInteger(input.confidence) || input.confidence < 1 || input.confidence > 5) {
    throw new Error("Knowledge card confidence must be an integer from 1 to 5.");
  }

  return {
    id: input.id,
    trackId: normalizeRequiredText(input.trackId, "trackId"),
    moduleId: normalizeRequiredText(input.moduleId, "moduleId"),
    title: normalizeRequiredText(input.title, "title"),
    slug: normalizeRequiredText(input.slug, "slug"),
    sourceIds: [...input.sourceIds],
    evidenceIds: [...input.evidenceIds],
    relatedCardIds: [...(input.relatedCardIds ?? [])],
    maturity: input.maturity ?? "observed",
    confidence: input.confidence,
    summary: normalizeRequiredText(input.summary, "summary"),
    markdownPath: normalizeOptionalText(input.markdownPath),
    createdAt: input.createdAt,
    updatedAt: input.updatedAt
  };
}

export function transitionKnowledgeCardMaturity(
  card: KnowledgeCard,
  nextMaturity: KnowledgeMaturity,
  updatedAt = card.updatedAt
): KnowledgeCard {
  const maturityOrder: KnowledgeMaturity[] = [
    "observed",
    "understood",
    "verified",
    "applied",
    "teachable"
  ];
  const currentIndex = maturityOrder.indexOf(card.maturity);
  const nextIndex = maturityOrder.indexOf(nextMaturity);

  if (nextIndex !== currentIndex + 1) {
    throw new Error(
      `Knowledge card maturity cannot move from ${card.maturity} to ${nextMaturity}.`
    );
  }

  return {
    ...card,
    maturity: nextMaturity,
    updatedAt
  };
}

export function calculateNextReviewAt(
  input: CalculateNextReviewInput
): string {
  const now = parseDateTime(input.now, "now");

  if (!Number.isInteger(input.ease) || input.ease < 1 || input.ease > 5) {
    throw new Error("Review ease must be an integer from 1 to 5.");
  }

  assertNonNegativeInteger(input.reviewCount, "reviewCount");
  assertNonNegativeInteger(input.lapseCount, "lapseCount");

  const intervalIndex = Math.min(input.reviewCount, REVIEW_INTERVAL_DAYS.length - 1);
  const intervalDays =
    input.ease <= 2 || input.lapseCount > 0
      ? REVIEW_INTERVAL_DAYS[0]
      : REVIEW_INTERVAL_DAYS[intervalIndex];

  return new Date(now.getTime() + intervalDays * DAY_MS).toISOString();
}

export function isCoachModeAllowed(
  mode: AICoachMode,
  aiGuidance: AIGuidance
): boolean {
  return getCoachBoundaryDecision({
    mode,
    aiGuidance,
    requestedAction: "guidance"
  }).boundary === "allowed";
}

export function getCoachBoundaryDecision(input: {
  mode: AICoachMode;
  aiGuidance: AIGuidance;
  requestedAction: AICoachRequestedAction;
}): { boundary: AICoachBoundary; reason?: string } {
  if (input.aiGuidance === "restricted") {
    return {
      boundary: "blocked",
      reason: "This learning source does not allow AI coaching."
    };
  }

  if (input.mode === "direct_solution") {
    return {
      boundary: "blocked",
      reason: "Direct solutions are outside the learning coach boundary."
    };
  }

  const blockedActionReasons: Partial<
    Record<AICoachRequestedAction, string>
  > = {
    todo_completion:
      "TODO completion is outside the learning coach boundary.",
    edit_assignment:
      "Automated assignment edits are outside the learning coach boundary.",
    run_assignment_command:
      "Running assignment commands is outside the learning coach boundary."
  };
  const reason = blockedActionReasons[input.requestedAction];

  return reason
    ? { boundary: "blocked", reason }
    : { boundary: "allowed" };
}

function normalizeRequiredText(value: string, fieldName: string): string {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error(`${fieldName} must not be blank.`);
  }

  return normalized;
}

function normalizeOptionalText(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  const normalized = value.trim();
  return normalized || undefined;
}

function assertHttpUrl(value: string, fieldName: string): void {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error(`${fieldName} must be a valid URL.`);
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`${fieldName} must use http or https.`);
  }
}

function assertPositiveInteger(value: number, fieldName: string): void {
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${fieldName} must be a positive integer.`);
  }
}

function assertNonNegativeInteger(value: number, fieldName: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${fieldName} must be a non-negative integer.`);
  }
}

function parseDateTime(value: string, fieldName: string): Date {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`${fieldName} must be a valid ISO date-time.`);
  }

  return parsed;
}
