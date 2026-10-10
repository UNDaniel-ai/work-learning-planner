import { randomUUID } from "node:crypto";
import { z } from "zod";
import { errorResponse } from "../http";
import { getPlanningRuntime } from "../../../../lib/planning/runtime";

const createGoalSchema = z.object({
  areaId: z.string().min(1).default("area-work"),
  title: z.string().min(1),
  horizon: z.enum(["quarter", "month", "week"])
});

export async function GET() {
  try {
    const { repository } = await getPlanningRuntime();

    return Response.json({
      areas: await repository.listAreas(),
      goals: await repository.listGoals(),
      learningTopics: await repository.listLearningTopics()
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = createGoalSchema.parse(await request.json());
    const { useCases } = await getPlanningRuntime();
    const goal = await useCases.createGoal({
      id: randomUUID(),
      areaId: body.areaId,
      title: body.title,
      horizon: body.horizon
    });

    return Response.json(goal, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
