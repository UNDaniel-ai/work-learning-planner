import { z } from "zod";
import { getLearningRuntime } from "../../../../../lib/learning/runtime";
import { learningErrorResponse } from "../../http";

type RouteContext = {
  params: Promise<{ cardId: string }>;
};

const updateCardSchema = z.object({
  maturity: z.enum([
    "observed",
    "understood",
    "verified",
    "applied",
    "teachable"
  ]),
  confidence: z.number().int().min(1).max(5).optional()
});

export async function GET(request: Request, context: RouteContext) {
  try {
    const { cardId } = await context.params;
    const { useCases } = await getLearningRuntime(request);
    return Response.json(await useCases.getKnowledgeCardDetails(cardId));
  } catch (error) {
    return learningErrorResponse(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { cardId } = await context.params;
    const body = updateCardSchema.parse(await request.json());
    const { useCases } = await getLearningRuntime(request);
    return Response.json(
      await useCases.updateKnowledgeCard({ id: cardId, ...body })
    );
  } catch (error) {
    return learningErrorResponse(error);
  }
}
