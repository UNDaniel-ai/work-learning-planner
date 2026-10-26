import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  EvidenceItem,
  KnowledgeCard,
  ReviewItem
} from "../../../domain/learning/types";
import { LearningUseCaseError } from "../../../domain/learning/use-cases";
import { GET as getCards, POST as postCard } from "./cards/route";
import {
  GET as getCard,
  PATCH as patchCard
} from "./cards/[cardId]/route";
import { GET as getReviews, POST as postReview } from "./reviews/route";

const mocks = vi.hoisted(() => {
  const evidence: EvidenceItem = {
    id: "evidence-mask",
    sessionId: "session-attention",
    kind: "toy_example",
    title: "Two-token causal mask",
    summary: "The future token receives a masked logit.",
    reference: "tests/test_attention.py::test_causal_mask",
    result: "pass",
    createdAt: "2026-10-19T13:30:00.000Z"
  };
  const card: KnowledgeCard = {
    id: "card-attention",
    trackId: "track-cs336",
    moduleId: "module-attention",
    title: "Scaled dot-product attention",
    slug: "scaled-dot-product-attention",
    sourceIds: ["source-cs336"],
    evidenceIds: [evidence.id],
    relatedCardIds: [],
    maturity: "observed",
    confidence: 3,
    summary: "Attention scores are masked before softmax.",
    createdAt: "2026-10-19T14:00:00.000Z",
    updatedAt: "2026-10-19T14:00:00.000Z"
  };
  const reviewItem: ReviewItem = {
    id: "review-attention",
    knowledgeCardId: card.id,
    prompt: "Why is the mask applied before softmax?",
    nextReviewAt: "2026-10-20T12:00:00.000Z",
    ease: 3,
    reviewCount: 0,
    lapseCount: 0,
    status: "active"
  };

  return {
    evidence,
    card,
    reviewItem,
    repository: {
      listKnowledgeCards: vi.fn(async () => [card]),
      listKnowledgeCardsForTrack: vi.fn(async () => [card]),
      listReviewQueue: vi.fn(async () => [reviewItem])
    },
    useCases: {
      createKnowledgeCard: vi.fn(async () => ({ card, reviewItem })),
      updateKnowledgeCard: vi.fn(async () => ({
        ...card,
        maturity: "understood" as const
      })),
      getKnowledgeCardDetails: vi.fn(async () => ({
        card,
        evidence: [evidence],
        reviewItems: [reviewItem]
      })),
      recordReview: vi.fn(async () => ({
        ...reviewItem,
        reviewCount: 1
      }))
    }
  };
});

vi.mock("../../../lib/learning/runtime", () => ({
  getLearningRuntime: vi.fn(async () => ({
    repository: mocks.repository,
    useCases: mocks.useCases
  }))
}));

describe("knowledge card and review API routes", () => {
  beforeEach(() => vi.clearAllMocks());

  it("promotes a session to a knowledge card with a review item", async () => {
    const response = await postCard(
      jsonRequest("http://localhost/api/learning/cards", {
        id: "card-attention",
        reviewItemId: "review-attention",
        sessionId: "session-attention",
        slug: "scaled-dot-product-attention",
        title: "Scaled dot-product attention",
        sourceIds: ["source-cs336"],
        evidenceIds: ["evidence-mask"],
        summary: "Attention scores are masked before softmax.",
        confidence: 3,
        reviewPrompt: "Why is the mask applied before softmax?"
      })
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      card: mocks.card,
      reviewItem: mocks.reviewItem
    });
  });

  it("lists cards, loads details, and advances maturity", async () => {
    await expect(
      (
        await getCards(
          new Request("http://localhost/api/learning/cards?trackId=track-cs336")
        )
      ).json()
    ).resolves.toEqual({ cards: [mocks.card] });
    const context = { params: Promise.resolve({ cardId: "card-attention" }) };
    await expect(
      (
        await getCard(
          new Request("http://localhost/api/learning/cards/card-attention"),
          context
        )
      ).json()
    ).resolves.toEqual({
      card: mocks.card,
      evidence: [mocks.evidence],
      reviewItems: [mocks.reviewItem]
    });
    const response = await patchCard(
      jsonRequest("http://localhost/api/learning/cards/card-attention", {
        maturity: "understood",
        confidence: 4
      }),
      context
    );

    expect(response.status).toBe(200);
    expect(mocks.useCases.updateKnowledgeCard).toHaveBeenCalledWith({
      id: "card-attention",
      maturity: "understood",
      confidence: 4
    });
  });

  it("loads the due queue and records a recall answer", async () => {
    const queueResponse = await getReviews(
      new Request(
        "http://localhost/api/learning/reviews?dueAt=2026-10-20T12:00:00.000Z"
      )
    );
    await expect(queueResponse.json()).resolves.toEqual({
      reviewItems: [mocks.reviewItem]
    });
    expect(mocks.repository.listReviewQueue).toHaveBeenCalledWith(
      "2026-10-20T12:00:00.000Z"
    );

    const response = await postReview(
      jsonRequest("http://localhost/api/learning/reviews", {
        id: "review-attention",
        answer: "Forbidden positions receive zero probability.",
        ease: 4
      })
    );
    expect(response.status).toBe(200);
    expect(mocks.useCases.recordReview).toHaveBeenCalledWith({
      id: "review-attention",
      answer: "Forbidden positions receive zero probability.",
      ease: 4
    });
  });

  it("returns 422 for a card with invalid evidence", async () => {
    mocks.useCases.createKnowledgeCard.mockRejectedValueOnce(
      new LearningUseCaseError(
        "CARD_EVIDENCE_INVALID",
        "Knowledge card evidence must belong to the selected session."
      )
    );
    const response = await postCard(
      jsonRequest("http://localhost/api/learning/cards", {
        sessionId: "session-attention",
        slug: "invalid-card",
        title: "Invalid card",
        sourceIds: ["source-cs336"],
        evidenceIds: ["evidence-other"],
        summary: "Invalid.",
        confidence: 3,
        reviewPrompt: "Why?"
      })
    );

    expect(response.status).toBe(422);
  });
});

function jsonRequest(url: string, body: unknown): Request {
  return new Request(url, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" }
  });
}
