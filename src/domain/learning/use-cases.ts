import type { MarkdownAssetWriter } from "../../lib/learning/markdown-assets";
import type { LearningTopic } from "../planning/types";
import {
  createLearningModule,
  createLearningSource,
  createLearningTrack,
  createEvidenceItem,
  createStudySession,
  createKnowledgeCard as buildKnowledgeCard,
  calculateNextReviewAt,
  getCoachBoundaryDecision,
  transitionKnowledgeCardMaturity,
  transitionStudySession,
  type CreateEvidenceItemInput,
  type CreateLearningModuleInput,
  type CreateLearningSourceInput,
  type CreateLearningTrackInput
} from "./rules";
import type {
  AICoachEvent,
  AICoachMode,
  AICoachRequestedAction,
  EvidenceItem,
  KnowledgeCard,
  KnowledgeMaturity,
  EntityId,
  LearningModule,
  LearningSource,
  LearningTrack,
  ReviewItem,
  StudySession,
  StudySessionStatus
} from "./types";

export type LearningUseCaseErrorCode =
  | "DUPLICATE_LEARNING_ID"
  | "LEARNING_SOURCE_NOT_FOUND"
  | "LEARNING_TOPIC_NOT_FOUND"
  | "LEARNING_TRACK_NOT_FOUND"
  | "LEARNING_MODULE_NOT_FOUND"
  | "STUDY_SESSION_NOT_FOUND"
  | "SESSION_EVIDENCE_REQUIRED"
  | "SESSION_BLOCKER_REQUIRED"
  | "KNOWLEDGE_CARD_NOT_FOUND"
  | "REVIEW_ITEM_NOT_FOUND"
  | "CARD_EVIDENCE_INVALID";

export class LearningUseCaseError extends Error {
  readonly code: LearningUseCaseErrorCode;

  constructor(code: LearningUseCaseErrorCode, message: string) {
    super(message);
    this.name = "LearningUseCaseError";
    this.code = code;
  }
}

export type LearningUseCaseRepository = {
  createSource(source: LearningSource): Promise<void>;
  getSource(sourceId: EntityId): Promise<LearningSource | undefined>;
  createTrack(track: LearningTrack): Promise<void>;
  getTrack(trackId: EntityId): Promise<LearningTrack | undefined>;
  createModule(learningModule: LearningModule): Promise<void>;
  getModule(moduleId: EntityId): Promise<LearningModule | undefined>;
  listModulesForTrack(trackId: EntityId): Promise<LearningModule[]>;
  createSession(session: StudySession): Promise<void>;
  updateSession(session: StudySession): Promise<void>;
  getSession(sessionId: EntityId): Promise<StudySession | undefined>;
  createEvidence(evidence: EvidenceItem): Promise<void>;
  getEvidence(evidenceId: EntityId): Promise<EvidenceItem | undefined>;
  listEvidenceForSession(sessionId: EntityId): Promise<EvidenceItem[]>;
  createKnowledgeCard(card: KnowledgeCard): Promise<void>;
  updateKnowledgeCard(card: KnowledgeCard): Promise<void>;
  getKnowledgeCard(cardId: EntityId): Promise<KnowledgeCard | undefined>;
  createReviewItem(reviewItem: ReviewItem): Promise<void>;
  updateReviewItem(reviewItem: ReviewItem): Promise<void>;
  getReviewItem(reviewItemId: EntityId): Promise<ReviewItem | undefined>;
  listReviewItemsForCard(cardId: EntityId): Promise<ReviewItem[]>;
  createCoachEvent(event: AICoachEvent): Promise<void>;
  getCoachEvent(eventId: EntityId): Promise<AICoachEvent | undefined>;
  listCoachEventsForSession(sessionId: EntityId): Promise<AICoachEvent[]>;
};

type PlanningTopicRepository = {
  listLearningTopics(): Promise<LearningTopic[]>;
};

type LearningStructureWriter = Pick<
  MarkdownAssetWriter,
  | "writeTrack"
  | "writeModule"
  | "writeSession"
  | "writeEvidence"
  | "updateSessionMetadata"
  | "writeKnowledgeCard"
  | "updateKnowledgeCardMetadata"
>;

export type CreateLearningUseCasesInput = {
  repository: LearningUseCaseRepository;
  planningRepository: PlanningTopicRepository;
  writer: LearningStructureWriter;
  now?: () => string;
};

export type CreateSourceUseCaseInput = Omit<
  CreateLearningSourceInput,
  "createdAt" | "updatedAt"
>;

export type CreateTrackModuleInput = Omit<
  CreateLearningModuleInput,
  "trackId" | "createdAt" | "updatedAt" | "markdownPath"
> & {
  slug: string;
};

export type CreateTrackUseCaseInput = Omit<
  CreateLearningTrackInput,
  "createdAt" | "updatedAt"
> & {
  sourceSlug: string;
  modules: CreateTrackModuleInput[];
};

export type LearningTrackDetails = {
  source: LearningSource;
  track: LearningTrack;
  modules: LearningModule[];
};

export type CreateSessionUseCaseInput = {
  id: EntityId;
  moduleId: EntityId;
  planningPeriodId?: EntityId;
  timeBlockId?: EntityId;
  taskLinkId?: EntityId;
  slug: string;
  question: string;
  preUnderstanding: string;
};

export type UpdateSessionUseCaseInput = {
  id: EntityId;
  status: StudySessionStatus;
  attemptSummary?: string;
  blocker?: string;
  outcome?: string;
};

export type AddEvidenceUseCaseInput = Omit<
  CreateEvidenceItemInput,
  "createdAt"
> & {
  slug: string;
};

export type StudySessionDetails = {
  module: LearningModule;
  session: StudySession;
  evidence: EvidenceItem[];
  coachEvents: AICoachEvent[];
};

export type RecordCoachEventUseCaseInput = {
  id: EntityId;
  sessionId: EntityId;
  mode: AICoachMode;
  requestedAction: AICoachRequestedAction;
  inputSummary: string;
  outputSummary?: string;
};

export type CreateKnowledgeCardUseCaseInput = {
  id: EntityId;
  reviewItemId: EntityId;
  sessionId: EntityId;
  slug: string;
  title: string;
  sourceIds: EntityId[];
  evidenceIds: EntityId[];
  relatedCardIds?: EntityId[];
  summary: string;
  confidence: number;
  reviewPrompt: string;
  answerHint?: string;
};

export type UpdateKnowledgeCardUseCaseInput = {
  id: EntityId;
  maturity: KnowledgeMaturity;
  confidence?: number;
};

export type RecordReviewUseCaseInput = {
  id: EntityId;
  answer: string;
  ease: number;
  errorType?: string;
};

export type KnowledgeCardDetails = {
  card: KnowledgeCard;
  evidence: EvidenceItem[];
  reviewItems: ReviewItem[];
};

export function createLearningUseCases(input: CreateLearningUseCasesInput) {
  const now = input.now ?? (() => new Date().toISOString());

  return {
    async createSource(
      sourceInput: CreateSourceUseCaseInput
    ): Promise<LearningSource> {
      await assertAvailableId(
        input.repository.getSource(sourceInput.id),
        "Learning source",
        sourceInput.id
      );
      const timestamp = now();
      const source = createLearningSource({
        ...sourceInput,
        createdAt: timestamp,
        updatedAt: timestamp
      });

      await input.repository.createSource(source);

      return source;
    },

    async createTrack(trackInput: CreateTrackUseCaseInput): Promise<{
      track: LearningTrack;
      modules: LearningModule[];
    }> {
      const source = await input.repository.getSource(trackInput.sourceId);

      if (!source) {
        throw new LearningUseCaseError(
          "LEARNING_SOURCE_NOT_FOUND",
          `Learning source not found: ${trackInput.sourceId}`
        );
      }

      if (trackInput.learningTopicId) {
        const topics = await input.planningRepository.listLearningTopics();
        if (!topics.some((topic) => topic.id === trackInput.learningTopicId)) {
          throw new LearningUseCaseError(
            "LEARNING_TOPIC_NOT_FOUND",
            `Learning topic not found: ${trackInput.learningTopicId}`
          );
        }
      }

      await assertAvailableId(
        input.repository.getTrack(trackInput.id),
        "Learning track",
        trackInput.id
      );
      assertUniqueModuleInputs(trackInput.modules);

      for (const moduleInput of trackInput.modules) {
        await assertAvailableId(
          input.repository.getModule(moduleInput.id),
          "Learning module",
          moduleInput.id
        );
      }

      const timestamp = now();
      const trackWithoutPath = createLearningTrack({
        id: trackInput.id,
        learningTopicId: trackInput.learningTopicId,
        sourceId: trackInput.sourceId,
        title: trackInput.title,
        objective: trackInput.objective,
        createdAt: timestamp,
        updatedAt: timestamp
      });
      const trackAsset = await input.writer.writeTrack({
        sourceSlug: trackInput.sourceSlug,
        track: trackWithoutPath
      });
      const track: LearningTrack = {
        ...trackWithoutPath,
        markdownPath: trackAsset.relativePath
      };
      const sortedModuleInputs = [...trackInput.modules].sort(
        (left, right) => left.sequence - right.sequence || left.id.localeCompare(right.id)
      );
      const modules: LearningModule[] = [];

      for (const moduleInput of sortedModuleInputs) {
        const moduleWithoutPath = createLearningModule({
          id: moduleInput.id,
          trackId: track.id,
          title: moduleInput.title,
          sequence: moduleInput.sequence,
          expectedOutcome: moduleInput.expectedOutcome,
          acceptanceCriteria: moduleInput.acceptanceCriteria,
          createdAt: timestamp,
          updatedAt: timestamp
        });
        const moduleAsset = await input.writer.writeModule({
          sourceSlug: trackInput.sourceSlug,
          slug: moduleInput.slug,
          learningModule: moduleWithoutPath
        });
        modules.push({
          ...moduleWithoutPath,
          markdownPath: moduleAsset.relativePath
        });
      }

      await input.repository.createTrack(track);
      for (const learningModule of modules) {
        await input.repository.createModule(learningModule);
      }

      return { track, modules };
    },

    async getTrackDetails(trackId: EntityId): Promise<LearningTrackDetails> {
      const track = await input.repository.getTrack(trackId);

      if (!track) {
        throw new LearningUseCaseError(
          "LEARNING_TRACK_NOT_FOUND",
          `Learning track not found: ${trackId}`
        );
      }

      const source = await input.repository.getSource(track.sourceId);
      if (!source) {
        throw new LearningUseCaseError(
          "LEARNING_SOURCE_NOT_FOUND",
          `Learning source not found: ${track.sourceId}`
        );
      }

      return {
        source,
        track,
        modules: await input.repository.listModulesForTrack(track.id)
      };
    },

    async createSession(
      sessionInput: CreateSessionUseCaseInput
    ): Promise<StudySession> {
      const learningModule = await getModuleOrThrow(
        input.repository,
        sessionInput.moduleId
      );
      await assertAvailableId(
        input.repository.getSession(sessionInput.id),
        "Study session",
        sessionInput.id
      );
      const track = await getTrackOrThrow(
        input.repository,
        learningModule.trackId
      );
      const timestamp = now();
      const sessionWithoutPath = createStudySession({
        id: sessionInput.id,
        moduleId: sessionInput.moduleId,
        planningPeriodId: sessionInput.planningPeriodId,
        timeBlockId: sessionInput.timeBlockId,
        taskLinkId: sessionInput.taskLinkId,
        question: sessionInput.question,
        preUnderstanding: sessionInput.preUnderstanding,
        createdAt: timestamp,
        updatedAt: timestamp
      });
      const asset = await input.writer.writeSession({
        sourceSlug: sourceSlugFromTrack(track),
        slug: sessionInput.slug,
        session: sessionWithoutPath
      });
      const session = {
        ...sessionWithoutPath,
        markdownPath: asset.relativePath
      };

      await input.repository.createSession(session);
      return session;
    },

    async updateSession(
      sessionInput: UpdateSessionUseCaseInput
    ): Promise<StudySession> {
      const existing = await getSessionOrThrow(input.repository, sessionInput.id);
      const evidence = await input.repository.listEvidenceForSession(existing.id);

      if (sessionInput.status === "completed" && evidence.length === 0) {
        throw new LearningUseCaseError(
          "SESSION_EVIDENCE_REQUIRED",
          "A completed study session requires at least one evidence item."
        );
      }

      if (
        sessionInput.status === "blocked" &&
        !sessionInput.blocker?.trim()
      ) {
        throw new LearningUseCaseError(
          "SESSION_BLOCKER_REQUIRED",
          "A blocked study session requires a blocker."
        );
      }

      const timestamp = now();
      const transitioned = transitionStudySession(
        existing,
        sessionInput.status,
        timestamp
      );
      const session: StudySession = {
        ...transitioned,
        startedAt:
          sessionInput.status === "active"
            ? existing.startedAt ?? timestamp
            : existing.startedAt,
        endedAt:
          sessionInput.status === "completed" ? timestamp : existing.endedAt,
        attemptSummary:
          sessionInput.attemptSummary ?? existing.attemptSummary,
        blocker: sessionInput.blocker ?? existing.blocker,
        outcome: sessionInput.outcome ?? existing.outcome
      };

      if (!session.markdownPath) {
        throw new Error(`Study session has no Markdown path: ${session.id}`);
      }

      await input.writer.updateSessionMetadata({
        relativePath: session.markdownPath,
        session,
        evidenceIds: evidence.map((item) => item.id)
      });
      await input.repository.updateSession(session);

      return session;
    },

    async addEvidence(
      evidenceInput: AddEvidenceUseCaseInput
    ): Promise<EvidenceItem> {
      const session = await getSessionOrThrow(
        input.repository,
        evidenceInput.sessionId
      );
      await assertAvailableId(
        input.repository.getEvidence(evidenceInput.id),
        "Evidence item",
        evidenceInput.id
      );
      const learningModule = await getModuleOrThrow(
        input.repository,
        session.moduleId
      );
      const track = await getTrackOrThrow(
        input.repository,
        learningModule.trackId
      );
      const evidenceWithoutPath = createEvidenceItem({
        id: evidenceInput.id,
        sessionId: evidenceInput.sessionId,
        kind: evidenceInput.kind,
        title: evidenceInput.title,
        summary: evidenceInput.summary,
        reference: evidenceInput.reference,
        result: evidenceInput.result,
        createdAt: now()
      });
      const asset = await input.writer.writeEvidence({
        sourceSlug: sourceSlugFromTrack(track),
        slug: evidenceInput.slug,
        evidence: evidenceWithoutPath
      });
      const evidence = {
        ...evidenceWithoutPath,
        markdownPath: asset.relativePath
      };

      await input.repository.createEvidence(evidence);
      if (session.markdownPath) {
        const existingEvidence = await input.repository.listEvidenceForSession(
          session.id
        );
        await input.writer.updateSessionMetadata({
          relativePath: session.markdownPath,
          session,
          evidenceIds: existingEvidence.map((item) => item.id)
        });
      }

      return evidence;
    },

    async getSessionDetails(sessionId: EntityId): Promise<StudySessionDetails> {
      const session = await getSessionOrThrow(input.repository, sessionId);

      return {
        module: await getModuleOrThrow(input.repository, session.moduleId),
        session,
        evidence: await input.repository.listEvidenceForSession(session.id),
        coachEvents: await input.repository.listCoachEventsForSession(session.id)
      };
    },

    async recordCoachEvent(
      eventInput: RecordCoachEventUseCaseInput
    ): Promise<AICoachEvent> {
      const session = await getSessionOrThrow(
        input.repository,
        eventInput.sessionId
      );
      const learningModule = await getModuleOrThrow(
        input.repository,
        session.moduleId
      );
      const track = await getTrackOrThrow(
        input.repository,
        learningModule.trackId
      );
      const source = await input.repository.getSource(track.sourceId);

      if (!source) {
        throw new LearningUseCaseError(
          "LEARNING_SOURCE_NOT_FOUND",
          `Learning source not found: ${track.sourceId}`
        );
      }

      await assertAvailableId(
        input.repository.getCoachEvent(eventInput.id),
        "AI coach event",
        eventInput.id
      );
      const decision = getCoachBoundaryDecision({
        mode: eventInput.mode,
        aiGuidance: source.aiGuidance,
        requestedAction: eventInput.requestedAction
      });
      const event: AICoachEvent = {
        id: eventInput.id,
        sessionId: session.id,
        mode: eventInput.mode,
        inputSummary: normalizeCoachSummary(
          eventInput.inputSummary,
          "Coach input summary"
        ),
        outputSummary:
          decision.boundary === "blocked"
            ? (decision.reason as string)
            : normalizeCoachSummary(
                eventInput.outputSummary,
                "Coach output summary"
              ),
        boundary: decision.boundary,
        createdAt: now()
      };

      await input.repository.createCoachEvent(event);
      return event;
    },

    async createKnowledgeCard(
      cardInput: CreateKnowledgeCardUseCaseInput
    ): Promise<{ card: KnowledgeCard; reviewItem: ReviewItem }> {
      const session = await getSessionOrThrow(
        input.repository,
        cardInput.sessionId
      );
      const learningModule = await getModuleOrThrow(
        input.repository,
        session.moduleId
      );
      const track = await getTrackOrThrow(
        input.repository,
        learningModule.trackId
      );
      await assertAvailableId(
        input.repository.getKnowledgeCard(cardInput.id),
        "Knowledge card",
        cardInput.id
      );
      await assertAvailableId(
        input.repository.getReviewItem(cardInput.reviewItemId),
        "Review item",
        cardInput.reviewItemId
      );

      if (!cardInput.sourceIds.includes(track.sourceId)) {
        throw new LearningUseCaseError(
          "CARD_EVIDENCE_INVALID",
          "Knowledge card sources must include the track source."
        );
      }

      const evidence = await Promise.all(
        cardInput.evidenceIds.map((evidenceId) =>
          input.repository.getEvidence(evidenceId)
        )
      );
      if (
        evidence.length === 0 ||
        evidence.some(
          (item) => !item || item.sessionId !== cardInput.sessionId
        )
      ) {
        throw new LearningUseCaseError(
          "CARD_EVIDENCE_INVALID",
          "Knowledge card evidence must belong to the selected session."
        );
      }

      const timestamp = now();
      const cardWithoutPath = buildKnowledgeCard({
        id: cardInput.id,
        trackId: track.id,
        moduleId: learningModule.id,
        title: cardInput.title,
        slug: cardInput.slug,
        sourceIds: cardInput.sourceIds,
        evidenceIds: cardInput.evidenceIds,
        relatedCardIds: cardInput.relatedCardIds,
        confidence: cardInput.confidence,
        summary: cardInput.summary,
        createdAt: timestamp,
        updatedAt: timestamp
      });
      const asset = await input.writer.writeKnowledgeCard({
        sourceSlug: sourceSlugFromTrack(track),
        card: cardWithoutPath
      });
      const card = {
        ...cardWithoutPath,
        markdownPath: asset.relativePath
      };
      const reviewItem: ReviewItem = {
        id: cardInput.reviewItemId,
        knowledgeCardId: card.id,
        prompt: cardInput.reviewPrompt.trim(),
        answerHint: cardInput.answerHint?.trim() || undefined,
        nextReviewAt: calculateNextReviewAt({
          now: timestamp,
          ease: 3,
          reviewCount: 0,
          lapseCount: 0
        }),
        ease: 3,
        reviewCount: 0,
        lapseCount: 0,
        status: "active"
      };

      if (!reviewItem.prompt) {
        throw new Error("Review prompt must not be blank.");
      }

      await input.repository.createKnowledgeCard(card);
      await input.repository.createReviewItem(reviewItem);

      return { card, reviewItem };
    },

    async updateKnowledgeCard(
      cardInput: UpdateKnowledgeCardUseCaseInput
    ): Promise<KnowledgeCard> {
      const existing = await getKnowledgeCardOrThrow(
        input.repository,
        cardInput.id
      );
      const timestamp = now();
      const transitioned = transitionKnowledgeCardMaturity(
        existing,
        cardInput.maturity,
        timestamp
      );
      const confidence = cardInput.confidence ?? existing.confidence;

      if (!Number.isInteger(confidence) || confidence < 1 || confidence > 5) {
        throw new Error("Knowledge card confidence must be an integer from 1 to 5.");
      }

      const card = { ...transitioned, confidence };
      if (!card.markdownPath) {
        throw new Error(`Knowledge card has no Markdown path: ${card.id}`);
      }

      await input.writer.updateKnowledgeCardMetadata({
        relativePath: card.markdownPath,
        card
      });
      await input.repository.updateKnowledgeCard(card);

      return card;
    },

    async recordReview(
      reviewInput: RecordReviewUseCaseInput
    ): Promise<ReviewItem> {
      const existing = await input.repository.getReviewItem(reviewInput.id);

      if (!existing) {
        throw new LearningUseCaseError(
          "REVIEW_ITEM_NOT_FOUND",
          `Review item not found: ${reviewInput.id}`
        );
      }

      const answer = reviewInput.answer.trim();
      if (!answer) {
        throw new Error("Review answer must not be blank.");
      }

      const reviewedAt = now();
      const reviewCount = existing.reviewCount + 1;
      const lapsed = reviewInput.ease <= 2;
      const reviewItem: ReviewItem = {
        ...existing,
        lastAnswer: answer,
        lastErrorType: reviewInput.errorType?.trim() || undefined,
        lastReviewedAt: reviewedAt,
        nextReviewAt: calculateNextReviewAt({
          now: reviewedAt,
          ease: reviewInput.ease,
          reviewCount,
          lapseCount: lapsed ? 1 : 0
        }),
        ease: reviewInput.ease,
        reviewCount,
        lapseCount: existing.lapseCount + (lapsed ? 1 : 0)
      };

      await input.repository.updateReviewItem(reviewItem);
      return reviewItem;
    },

    async getKnowledgeCardDetails(
      cardId: EntityId
    ): Promise<KnowledgeCardDetails> {
      const card = await getKnowledgeCardOrThrow(input.repository, cardId);
      const evidence = await Promise.all(
        card.evidenceIds.map((evidenceId) =>
          input.repository.getEvidence(evidenceId)
        )
      );

      return {
        card,
        evidence: evidence.filter(
          (item): item is EvidenceItem => item !== undefined
        ),
        reviewItems: await input.repository.listReviewItemsForCard(card.id)
      };
    }
  };
}

export type LearningUseCases = ReturnType<typeof createLearningUseCases>;

async function assertAvailableId(
  existing: Promise<unknown | undefined>,
  label: string,
  id: EntityId
): Promise<void> {
  if (await existing) {
    throw new LearningUseCaseError(
      "DUPLICATE_LEARNING_ID",
      `${label} already exists: ${id}`
    );
  }
}

function assertUniqueModuleInputs(modules: CreateTrackModuleInput[]): void {
  const ids = new Set<string>();
  const sequences = new Set<number>();

  for (const learningModule of modules) {
    if (ids.has(learningModule.id)) {
      throw new LearningUseCaseError(
        "DUPLICATE_LEARNING_ID",
        `Learning module appears more than once: ${learningModule.id}`
      );
    }

    if (sequences.has(learningModule.sequence)) {
      throw new Error(
        `Learning module sequence appears more than once: ${learningModule.sequence}`
      );
    }

    ids.add(learningModule.id);
    sequences.add(learningModule.sequence);
  }
}

async function getTrackOrThrow(
  repository: LearningUseCaseRepository,
  trackId: EntityId
): Promise<LearningTrack> {
  const track = await repository.getTrack(trackId);

  if (!track) {
    throw new LearningUseCaseError(
      "LEARNING_TRACK_NOT_FOUND",
      `Learning track not found: ${trackId}`
    );
  }

  return track;
}

async function getModuleOrThrow(
  repository: LearningUseCaseRepository,
  moduleId: EntityId
): Promise<LearningModule> {
  const learningModule = await repository.getModule(moduleId);

  if (!learningModule) {
    throw new LearningUseCaseError(
      "LEARNING_MODULE_NOT_FOUND",
      `Learning module not found: ${moduleId}`
    );
  }

  return learningModule;
}

async function getSessionOrThrow(
  repository: LearningUseCaseRepository,
  sessionId: EntityId
): Promise<StudySession> {
  const session = await repository.getSession(sessionId);

  if (!session) {
    throw new LearningUseCaseError(
      "STUDY_SESSION_NOT_FOUND",
      `Study session not found: ${sessionId}`
    );
  }

  return session;
}

function sourceSlugFromTrack(track: LearningTrack): string {
  const path = track.markdownPath?.replaceAll("\\", "/");
  const isUnsafe =
    !path || path.startsWith("/") || path.split("/").includes("..");
  const match = isUnsafe
    ? undefined
    : path.match(/(?:^|\/)([a-z0-9]+(?:-[a-z0-9]+)*)\/track\.md$/);

  if (!match) {
    throw new Error(`Learning track has no valid Markdown path: ${track.id}`);
  }

  return match[1];
}

function normalizeCoachSummary(
  value: string | undefined,
  label: string
): string {
  const summary = value?.trim();

  if (!summary) {
    throw new Error(`${label} must not be blank.`);
  }

  if (summary.length > 500) {
    throw new Error(`${label} must be 500 characters or fewer.`);
  }

  return summary;
}

async function getKnowledgeCardOrThrow(
  repository: LearningUseCaseRepository,
  cardId: EntityId
): Promise<KnowledgeCard> {
  const card = await repository.getKnowledgeCard(cardId);

  if (!card) {
    throw new LearningUseCaseError(
      "KNOWLEDGE_CARD_NOT_FOUND",
      `Knowledge card not found: ${cardId}`
    );
  }

  return card;
}
