import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getLearningRuntime } from "../../../../lib/learning/runtime";
import { learningErrorResponse } from "../http";

const createCardSchema = z.object({
  id: z.string().min(1).optional(),
  reviewItemId: z.string().min(1).optional(),
  sessionId: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(1),
  sourceIds: z.array(z.string().min(1)).min(1),
  evidenceIds: z.array(z.string().min(1)).min(1),
  relatedCardIds: z.array(z.string().min(1)).optional(),
  summary: z.string().min(1),
  confidence: z.number().int().min(1).max(5),
  reviewPrompt: z.string().min(1),
  answerHint: z.string().min(1).optional()
});

export async function GET(request?: Request) {
  try {
    const { repository } = await getLearningRuntime(request);
    const trackId = request
      ? new URL(request.url).searchParams.get("trackId")
      : null;
    const cards = trackId
      ? await repository.listKnowledgeCardsForTrack(trackId)
      : await repository.listKnowledgeCards();

    return Response.json({ cards });
  } catch (error) {
    return learningErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = createCardSchema.parse(await request.json());
    const { useCases } = await getLearningRuntime(request);
    const result = await useCases.createKnowledgeCard({
      ...body,
      id: body.id ?? randomUUID(),
      reviewItemId: body.reviewItemId ?? randomUUID()
    });

    return Response.json(result, { status: 201 });
  } catch (error) {
    return learningErrorResponse(error);
  }
}
