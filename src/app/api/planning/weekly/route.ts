import { randomUUID } from "node:crypto";
import { z } from "zod";
import { errorResponse } from "../http";
import { getPlanningRuntime } from "../../../../lib/planning/runtime";

const taskSchema = z.object({
  taskLinkId: z.string().min(1),
  title: z.string().min(1),
  projectId: z.string().optional(),
  dueDate: z.string().optional(),
  labels: z.array(z.string()).optional(),
  description: z.string().optional(),
  priority: z.number().int().optional()
});

const createWeeklyPlanSchema = z.object({
  anchorDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  focusGoalIds: z.array(z.string()).default([]),
  tasks: z.array(taskSchema).default([])
});

export async function GET(request?: Request) {
  try {
    const { repository } = await getPlanningRuntime(request);

    return Response.json({
      planningPeriods: await repository.listPlanningPeriods(),
      timeBlocks: await repository.listTimeBlocks()
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = createWeeklyPlanSchema.parse(await request.json());
    const { useCases } = await getPlanningRuntime(request);
    const period = await useCases.createWeeklyPlan({
      id: randomUUID(),
      anchorDate: body.anchorDate,
      focusGoalIds: body.focusGoalIds,
      tasks: body.tasks
    });

    return Response.json(period, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
