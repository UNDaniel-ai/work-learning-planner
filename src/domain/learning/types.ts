export type EntityId = string;

export type LearningSourceKind =
  | "course"
  | "paper"
  | "book"
  | "repo"
  | "article"
  | "video"
  | "project";

export type LearningSourceStatus = "active" | "archived";
export type AIGuidance = "open" | "coach_only" | "restricted";
export type LearningTrackStatus = "active" | "completed" | "archived";
export type LearningModuleStatus =
  | "not_started"
  | "active"
  | "blocked"
  | "completed";
export type StudySessionStatus =
  | "planned"
  | "active"
  | "completed"
  | "blocked";

export type EvidenceKind =
  | "test"
  | "error"
  | "toy_example"
  | "shape_check"
  | "performance"
  | "commit"
  | "source_quote"
  | "manual_summary";

export type EvidenceResult = "pass" | "fail" | "observed" | "unknown";
export type KnowledgeMaturity =
  | "observed"
  | "understood"
  | "verified"
  | "applied"
  | "teachable";
export type ReviewItemStatus = "active" | "suspended" | "mastered";
export type AICoachMode =
  | "socratic"
  | "concept_hint"
  | "debug_guide"
  | "code_review"
  | "synthesis"
  | "recall_quiz"
  | "direct_solution";
export type AICoachBoundary = "allowed" | "blocked";
export type AICoachRequestedAction =
  | "guidance"
  | "todo_completion"
  | "edit_assignment"
  | "run_assignment_command";

export type LearningSource = {
  id: EntityId;
  title: string;
  kind: LearningSourceKind;
  url: string;
  repositoryUrl?: string;
  revision?: string;
  license?: string;
  aiGuidance: AIGuidance;
  summary?: string;
  status: LearningSourceStatus;
  createdAt: string;
  updatedAt: string;
};

export type LearningTrack = {
  id: EntityId;
  learningTopicId?: EntityId;
  sourceId: EntityId;
  title: string;
  objective: string;
  status: LearningTrackStatus;
  markdownPath?: string;
  createdAt: string;
  updatedAt: string;
};

export type LearningModule = {
  id: EntityId;
  trackId: EntityId;
  title: string;
  sequence: number;
  status: LearningModuleStatus;
  expectedOutcome: string;
  acceptanceCriteria: string[];
  markdownPath?: string;
  createdAt: string;
  updatedAt: string;
};

export type StudySession = {
  id: EntityId;
  moduleId: EntityId;
  planningPeriodId?: EntityId;
  timeBlockId?: EntityId;
  taskLinkId?: EntityId;
  startedAt?: string;
  endedAt?: string;
  status: StudySessionStatus;
  question: string;
  preUnderstanding: string;
  attemptSummary?: string;
  blocker?: string;
  outcome?: string;
  markdownPath?: string;
  createdAt: string;
  updatedAt: string;
};

export type EvidenceItem = {
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

export type KnowledgeCard = {
  id: EntityId;
  trackId: EntityId;
  moduleId: EntityId;
  title: string;
  slug: string;
  sourceIds: EntityId[];
  evidenceIds: EntityId[];
  relatedCardIds: EntityId[];
  maturity: KnowledgeMaturity;
  confidence: number;
  summary: string;
  markdownPath?: string;
  createdAt: string;
  updatedAt: string;
};

export type ReviewItem = {
  id: EntityId;
  knowledgeCardId: EntityId;
  prompt: string;
  answerHint?: string;
  lastAnswer?: string;
  lastErrorType?: string;
  lastReviewedAt?: string;
  nextReviewAt: string;
  ease: number;
  reviewCount: number;
  lapseCount: number;
  status: ReviewItemStatus;
};

export type AICoachEvent = {
  id: EntityId;
  sessionId: EntityId;
  mode: AICoachMode;
  inputSummary: string;
  outputSummary: string;
  boundary: AICoachBoundary;
  createdAt: string;
};

export type LearningSessionSummary = {
  session: StudySession;
  module: LearningModule;
};

export type BlockedLearningQuestion = {
  sessionId: EntityId;
  moduleId: EntityId;
  moduleTitle: string;
  question: string;
  blocker?: string;
};

export type LearningPeriodSummary = {
  sessions: LearningSessionSummary[];
  evidence: EvidenceItem[];
  knowledgeCards: KnowledgeCard[];
  blockedQuestions: BlockedLearningQuestion[];
};
