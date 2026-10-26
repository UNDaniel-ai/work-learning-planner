import { z } from "zod";
import { getLearningRuntime } from "../../../../../lib/learning/runtime";
import { learningErrorResponse } from "../../http";

type RouteContext = {
  params: Promise<{ sessionId: string }>;
};

const updateSessionSchema = z.object({
  status: z.enum(["active", "completed", "blocked"]),
  attemptSummary: z.string().min(1).optional(),
  blocker: z.string().min(1).optional(),
  outcome: z.string().min(1).optional()
});

export async function GET(request: Request, context: RouteContext) {
  try {
    const { sessionId } = await context.params;
    const { useCases } = await getLearningRuntime(request);
    return Response.json(await useCases.getSessionDetails(sessionId));
  } catch (error) {
    return learningErrorResponse(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { sessionId } = await context.params;
    const body = updateSessionSchema.parse(await request.json());
    const { useCases } = await getLearningRuntime(request);
    return Response.json(
      await useCases.updateSession({ id: sessionId, ...body })
    );
  } catch (error) {
    return learningErrorResponse(error);
  }
}
