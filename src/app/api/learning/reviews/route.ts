import { z } from "zod";
import { getLearningRuntime } from "../../../../lib/learning/runtime";
import { learningErrorResponse } from "../http";

const recordReviewSchema = z.object({
  id: z.string().min(1),
  answer: z.string().min(1),
  ease: z.number().int().min(1).max(5),
  errorType: z.string().min(1).optional()
});

export async function GET(request?: Request) {
  try {
    const { repository } = await getLearningRuntime(request);
    const dueAt = request
      ? new URL(request.url).searchParams.get("dueAt") ??
        new Date().toISOString()
      : new Date().toISOString();

    return Response.json({
      reviewItems: await repository.listReviewQueue(dueAt)
    });
  } catch (error) {
    return learningErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = recordReviewSchema.parse(await request.json());
    const { useCases } = await getLearningRuntime(request);
    return Response.json(await useCases.recordReview(body));
  } catch (error) {
    return learningErrorResponse(error);
  }
}
