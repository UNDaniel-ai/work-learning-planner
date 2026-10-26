import { randomUUID } from "node:crypto";
import { z } from "zod";
import { errorResponse } from "../http";
import { getPlanningRuntime } from "../../../../lib/planning/runtime";
import { getLearningRuntime } from "../../../../lib/learning/runtime";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const reviewSchema = z.object({
  periodId: z.string().min(1),
  type: z.enum(["daily", "weekly"]),
  date: dateSchema.optional(),
  wins: z.array(z.string()).default([]),
  misses: z.array(z.string()).default([]),
  adjustments: z.array(z.string()).default([]),
  actualMinutes: z.number().int().nonnegative().optional()
});

export async function GET(request: Request) {
  try {
    const periodId = new URL(request.url).searchParams.get("periodId");

    if (!periodId) {
      throw new Error("periodId is required.");
    }

    const [{ repository }, learningRuntime] = await Promise.all([
      getPlanningRuntime(request),
      getLearningRuntime(request)
    ]);

    return Response.json({
      reviews: await repository.listReviewsForPeriod(periodId),
      learning:
        await learningRuntime.repository.getPeriodLearningSummary(periodId)
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = reviewSchema.parse(await request.json());
    const { useCases } = await getPlanningRuntime(request);
    const review = await useCases.recordReview({
      id: randomUUID(),
      ...body
    });

    return Response.json(review, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
