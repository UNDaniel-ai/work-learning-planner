import { randomUUID } from "node:crypto";
import { z } from "zod";
import { errorResponse } from "../http";
import { getPlanningRuntime } from "../../../../lib/planning/runtime";

const createLearningTopicSchema = z.object({
  areaId: z.string().min(1).default("area-learning"),
  title: z.string().min(1),
  progressPercent: z.number().min(0).max(100).default(0)
});

export async function GET(request?: Request) {
  try {
    const { repository } = await getPlanningRuntime(request);

    return Response.json({
      areas: await repository.listAreas(),
      learningTopics: await repository.listLearningTopics()
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = createLearningTopicSchema.parse(await request.json());
    const { useCases } = await getPlanningRuntime(request);
    const topic = await useCases.createLearningTopic({
      id: randomUUID(),
      areaId: body.areaId,
      title: body.title,
      progressPercent: body.progressPercent
    });

    return Response.json(topic, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
