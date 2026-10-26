import { getLearningRuntime } from "../../../../../lib/learning/runtime";
import { learningErrorResponse } from "../../http";

type RouteContext = {
  params: Promise<{ trackId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const { trackId } = await context.params;
    const { useCases } = await getLearningRuntime(request);
    return Response.json(await useCases.getTrackDetails(trackId));
  } catch (error) {
    return learningErrorResponse(error);
  }
}
