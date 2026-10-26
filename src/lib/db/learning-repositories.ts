import { and, asc, eq, inArray, lte } from "drizzle-orm";
import type {
  AICoachEvent,
  EntityId,
  EvidenceItem,
  KnowledgeCard,
  LearningModule,
  LearningPeriodSummary,
  LearningSessionSummary,
  LearningSource,
  LearningTrack,
  ReviewItem,
  StudySession
} from "../../domain/learning/types";
import type { PlannerDatabase } from "./client";
import {
  aiCoachEvents,
  evidenceItems,
  knowledgeCards,
  learningModules,
  learningSources,
  learningTracks,
  reviewItems,
  studySessions
} from "./schema";

export type LearningDataExport = {
  sources: LearningSource[];
  tracks: LearningTrack[];
  modules: LearningModule[];
  sessions: StudySession[];
  evidence: EvidenceItem[];
  knowledgeCards: KnowledgeCard[];
  reviewItems: ReviewItem[];
  coachEvents: AICoachEvent[];
};

export function createLearningRepository(db: PlannerDatabase) {
  return {
    async createSource(source: LearningSource): Promise<void> {
      await db.insert(learningSources).values(normalizeOptional(source));
    },

    async updateSource(source: LearningSource): Promise<void> {
      await db
        .update(learningSources)
        .set(normalizeOptional(source))
        .where(eq(learningSources.id, source.id));
    },

    async getSource(sourceId: EntityId): Promise<LearningSource | undefined> {
      return getOne(
        db.select().from(learningSources).where(eq(learningSources.id, sourceId)),
        toLearningSource
      );
    },

    async listSources(): Promise<LearningSource[]> {
      const rows = await db
        .select()
        .from(learningSources)
        .orderBy(asc(learningSources.createdAt), asc(learningSources.id));

      return rows.map(toLearningSource);
    },

    async createTrack(track: LearningTrack): Promise<void> {
      await db.insert(learningTracks).values(normalizeOptional(track));
    },

    async updateTrack(track: LearningTrack): Promise<void> {
      await db
        .update(learningTracks)
        .set(normalizeOptional(track))
        .where(eq(learningTracks.id, track.id));
    },

    async getTrack(trackId: EntityId): Promise<LearningTrack | undefined> {
      return getOne(
        db.select().from(learningTracks).where(eq(learningTracks.id, trackId)),
        toLearningTrack
      );
    },

    async listTracks(): Promise<LearningTrack[]> {
      const rows = await db
        .select()
        .from(learningTracks)
        .orderBy(asc(learningTracks.createdAt), asc(learningTracks.id));

      return rows.map(toLearningTrack);
    },

    async listTracksForSource(sourceId: EntityId): Promise<LearningTrack[]> {
      const rows = await db
        .select()
        .from(learningTracks)
        .where(eq(learningTracks.sourceId, sourceId))
        .orderBy(asc(learningTracks.createdAt), asc(learningTracks.id));

      return rows.map(toLearningTrack);
    },

    async createModule(learningModule: LearningModule): Promise<void> {
      await db.insert(learningModules).values(normalizeOptional(learningModule));
    },

    async updateModule(learningModule: LearningModule): Promise<void> {
      await db
        .update(learningModules)
        .set(normalizeOptional(learningModule))
        .where(eq(learningModules.id, learningModule.id));
    },

    async getModule(moduleId: EntityId): Promise<LearningModule | undefined> {
      return getOne(
        db.select().from(learningModules).where(eq(learningModules.id, moduleId)),
        toLearningModule
      );
    },

    async listModules(): Promise<LearningModule[]> {
      const rows = await db
        .select()
        .from(learningModules)
        .orderBy(
          asc(learningModules.trackId),
          asc(learningModules.sequence),
          asc(learningModules.id)
        );

      return rows.map(toLearningModule);
    },

    async listModulesForTrack(trackId: EntityId): Promise<LearningModule[]> {
      const rows = await db
        .select()
        .from(learningModules)
        .where(eq(learningModules.trackId, trackId))
        .orderBy(asc(learningModules.sequence), asc(learningModules.id));

      return rows.map(toLearningModule);
    },

    async createSession(session: StudySession): Promise<void> {
      await db.insert(studySessions).values(normalizeOptional(session));
    },

    async updateSession(session: StudySession): Promise<void> {
      await db
        .update(studySessions)
        .set(normalizeOptional(session))
        .where(eq(studySessions.id, session.id));
    },

    async getSession(sessionId: EntityId): Promise<StudySession | undefined> {
      return getOne(
        db.select().from(studySessions).where(eq(studySessions.id, sessionId)),
        toStudySession
      );
    },

    async listSessions(): Promise<StudySession[]> {
      const rows = await db
        .select()
        .from(studySessions)
        .orderBy(asc(studySessions.createdAt), asc(studySessions.id));

      return rows.map(toStudySession);
    },

    async listSessionsForModule(moduleId: EntityId): Promise<StudySession[]> {
      const rows = await db
        .select()
        .from(studySessions)
        .where(eq(studySessions.moduleId, moduleId))
        .orderBy(asc(studySessions.createdAt), asc(studySessions.id));

      return rows.map(toStudySession);
    },

    async listSessionSummaries(filter?: {
      planningPeriodId?: EntityId;
      timeBlockIds?: EntityId[];
    }): Promise<LearningSessionSummary[]> {
      if (filter?.timeBlockIds?.length === 0) {
        return [];
      }

      const conditions = [
        filter?.planningPeriodId
          ? eq(studySessions.planningPeriodId, filter.planningPeriodId)
          : undefined,
        filter?.timeBlockIds
          ? inArray(studySessions.timeBlockId, filter.timeBlockIds)
          : undefined
      ].filter((condition) => condition !== undefined);
      let query = db
        .select({ session: studySessions, module: learningModules })
        .from(studySessions)
        .innerJoin(
          learningModules,
          eq(studySessions.moduleId, learningModules.id)
        )
        .$dynamic();

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const rows = await query.orderBy(
        asc(studySessions.createdAt),
        asc(studySessions.id)
      );

      return rows.map((row) => ({
        session: toStudySession(row.session),
        module: toLearningModule(row.module)
      }));
    },

    async getPeriodLearningSummary(
      planningPeriodId: EntityId
    ): Promise<LearningPeriodSummary> {
      const sessions = await this.listSessionSummaries({ planningPeriodId });

      if (sessions.length === 0) {
        return {
          sessions: [],
          evidence: [],
          knowledgeCards: [],
          blockedQuestions: []
        };
      }

      const sessionIds = sessions.map(({ session }) => session.id);
      const moduleIds = [
        ...new Set(sessions.map(({ module }) => module.id))
      ];
      const [evidenceRows, cardRows] = await Promise.all([
        db
          .select()
          .from(evidenceItems)
          .where(inArray(evidenceItems.sessionId, sessionIds))
          .orderBy(asc(evidenceItems.createdAt), asc(evidenceItems.id)),
        db
          .select()
          .from(knowledgeCards)
          .where(inArray(knowledgeCards.moduleId, moduleIds))
          .orderBy(asc(knowledgeCards.createdAt), asc(knowledgeCards.id))
      ]);

      return {
        sessions,
        evidence: evidenceRows.map(toEvidenceItem),
        knowledgeCards: cardRows.map(toKnowledgeCard),
        blockedQuestions: sessions
          .filter(({ session }) => session.status === "blocked")
          .map(({ session, module }) => ({
            sessionId: session.id,
            moduleId: module.id,
            moduleTitle: module.title,
            question: session.question,
            blocker: session.blocker
          }))
      };
    },

    async createEvidence(evidence: EvidenceItem): Promise<void> {
      await db.insert(evidenceItems).values(normalizeOptional(evidence));
    },

    async getEvidence(evidenceId: EntityId): Promise<EvidenceItem | undefined> {
      return getOne(
        db.select().from(evidenceItems).where(eq(evidenceItems.id, evidenceId)),
        toEvidenceItem
      );
    },

    async listEvidence(): Promise<EvidenceItem[]> {
      const rows = await db
        .select()
        .from(evidenceItems)
        .orderBy(asc(evidenceItems.createdAt), asc(evidenceItems.id));

      return rows.map(toEvidenceItem);
    },

    async listEvidenceForSession(sessionId: EntityId): Promise<EvidenceItem[]> {
      const rows = await db
        .select()
        .from(evidenceItems)
        .where(eq(evidenceItems.sessionId, sessionId))
        .orderBy(asc(evidenceItems.createdAt), asc(evidenceItems.id));

      return rows.map(toEvidenceItem);
    },

    async createKnowledgeCard(card: KnowledgeCard): Promise<void> {
      await db.insert(knowledgeCards).values(normalizeOptional(card));
    },

    async updateKnowledgeCard(card: KnowledgeCard): Promise<void> {
      await db
        .update(knowledgeCards)
        .set(normalizeOptional(card))
        .where(eq(knowledgeCards.id, card.id));
    },

    async getKnowledgeCard(cardId: EntityId): Promise<KnowledgeCard | undefined> {
      return getOne(
        db.select().from(knowledgeCards).where(eq(knowledgeCards.id, cardId)),
        toKnowledgeCard
      );
    },

    async listKnowledgeCards(): Promise<KnowledgeCard[]> {
      const rows = await db
        .select()
        .from(knowledgeCards)
        .orderBy(asc(knowledgeCards.createdAt), asc(knowledgeCards.id));

      return rows.map(toKnowledgeCard);
    },

    async listKnowledgeCardsForTrack(trackId: EntityId): Promise<KnowledgeCard[]> {
      const rows = await db
        .select()
        .from(knowledgeCards)
        .where(eq(knowledgeCards.trackId, trackId))
        .orderBy(asc(knowledgeCards.createdAt), asc(knowledgeCards.id));

      return rows.map(toKnowledgeCard);
    },

    async listKnowledgeCardsForModule(moduleId: EntityId): Promise<KnowledgeCard[]> {
      const rows = await db
        .select()
        .from(knowledgeCards)
        .where(eq(knowledgeCards.moduleId, moduleId))
        .orderBy(asc(knowledgeCards.createdAt), asc(knowledgeCards.id));

      return rows.map(toKnowledgeCard);
    },

    async createReviewItem(reviewItem: ReviewItem): Promise<void> {
      await db.insert(reviewItems).values(normalizeOptional(reviewItem));
    },

    async updateReviewItem(reviewItem: ReviewItem): Promise<void> {
      await db
        .update(reviewItems)
        .set(normalizeOptional(reviewItem))
        .where(eq(reviewItems.id, reviewItem.id));
    },

    async getReviewItem(reviewItemId: EntityId): Promise<ReviewItem | undefined> {
      return getOne(
        db.select().from(reviewItems).where(eq(reviewItems.id, reviewItemId)),
        toReviewItem
      );
    },

    async listReviewItems(): Promise<ReviewItem[]> {
      const rows = await db
        .select()
        .from(reviewItems)
        .orderBy(asc(reviewItems.nextReviewAt), asc(reviewItems.id));

      return rows.map(toReviewItem);
    },

    async listReviewItemsForCard(cardId: EntityId): Promise<ReviewItem[]> {
      const rows = await db
        .select()
        .from(reviewItems)
        .where(eq(reviewItems.knowledgeCardId, cardId))
        .orderBy(asc(reviewItems.nextReviewAt), asc(reviewItems.id));

      return rows.map(toReviewItem);
    },

    async listReviewQueue(dueAt: string): Promise<ReviewItem[]> {
      const rows = await db
        .select()
        .from(reviewItems)
        .where(
          and(
            eq(reviewItems.status, "active"),
            lte(reviewItems.nextReviewAt, dueAt)
          )
        )
        .orderBy(asc(reviewItems.nextReviewAt), asc(reviewItems.id));

      return rows.map(toReviewItem);
    },

    async createCoachEvent(event: AICoachEvent): Promise<void> {
      await db.insert(aiCoachEvents).values(event);
    },

    async getCoachEvent(eventId: EntityId): Promise<AICoachEvent | undefined> {
      return getOne(
        db.select().from(aiCoachEvents).where(eq(aiCoachEvents.id, eventId)),
        toAICoachEvent
      );
    },

    async listCoachEvents(): Promise<AICoachEvent[]> {
      return db
        .select()
        .from(aiCoachEvents)
        .orderBy(asc(aiCoachEvents.createdAt), asc(aiCoachEvents.id));
    },

    async listCoachEventsForSession(sessionId: EntityId): Promise<AICoachEvent[]> {
      return db
        .select()
        .from(aiCoachEvents)
        .where(eq(aiCoachEvents.sessionId, sessionId))
        .orderBy(asc(aiCoachEvents.createdAt), asc(aiCoachEvents.id));
    },

    async exportLearningData(): Promise<LearningDataExport> {
      const [
        sources,
        tracks,
        modules,
        sessions,
        evidence,
        cards,
        queuedReviews,
        coachEvents
      ] = await Promise.all([
        this.listSources(),
        this.listTracks(),
        this.listModules(),
        this.listSessions(),
        this.listEvidence(),
        this.listKnowledgeCards(),
        this.listReviewItems(),
        this.listCoachEvents()
      ]);

      return {
        sources,
        tracks,
        modules,
        sessions,
        evidence,
        knowledgeCards: cards,
        reviewItems: queuedReviews,
        coachEvents
      };
    }
  };
}

export type LearningRepository = ReturnType<typeof createLearningRepository>;

async function getOne<Row, Value>(
  query: PromiseLike<Row[]>,
  map: (row: Row) => Value
): Promise<Value | undefined> {
  const [row] = await query;
  return row ? map(row) : undefined;
}

function normalizeOptional<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).map(([key, entryValue]) => [
      key,
      entryValue === undefined ? null : entryValue
    ])
  ) as T;
}

function normalizeUndefined<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).map(([key, entryValue]) => [
      key,
      entryValue === null ? undefined : entryValue
    ])
  ) as T;
}

function toLearningSource(
  row: typeof learningSources.$inferSelect
): LearningSource {
  return normalizeUndefined(row) as LearningSource;
}

function toLearningTrack(row: typeof learningTracks.$inferSelect): LearningTrack {
  return normalizeUndefined(row) as LearningTrack;
}

function toLearningModule(
  row: typeof learningModules.$inferSelect
): LearningModule {
  return normalizeUndefined(row) as LearningModule;
}

function toStudySession(row: typeof studySessions.$inferSelect): StudySession {
  return normalizeUndefined(row) as StudySession;
}

function toEvidenceItem(row: typeof evidenceItems.$inferSelect): EvidenceItem {
  return normalizeUndefined(row) as EvidenceItem;
}

function toKnowledgeCard(
  row: typeof knowledgeCards.$inferSelect
): KnowledgeCard {
  return normalizeUndefined(row) as KnowledgeCard;
}

function toReviewItem(row: typeof reviewItems.$inferSelect): ReviewItem {
  return normalizeUndefined(row) as ReviewItem;
}

function toAICoachEvent(row: typeof aiCoachEvents.$inferSelect): AICoachEvent {
  return row;
}
