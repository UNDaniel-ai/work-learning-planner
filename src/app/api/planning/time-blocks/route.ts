import { randomUUID } from "node:crypto";
import { z } from "zod";
import { errorResponse } from "../http";
import { getPlanningRuntime } from "../../../../lib/planning/runtime";

const createTimeBlockSchema = z.object({
  periodId: z.string().min(1),
  areaId: z.string().min(1),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  taskLinkId: z.string().min(1).optional(),
  actualMinutes: z.number().int().nonnegative().optional(),
  note: z.string().optional()
});

const updateTimeBlockSchema = z.object({
  id: z.string().min(1),
  actualMinutes: z.number().int().nonnegative()
});

export async function POST(request: Request) {
  try {
    const body = createTimeBlockSchema.parse(await request.json());
    const { useCases } = await getPlanningRuntime();
    const timeBlock = await useCases.scheduleTimeBlock({
      id: randomUUID(),
      ...body
    });

    return Response.json(timeBlock, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const body = updateTimeBlockSchema.parse(await request.json());
    const { useCases } = await getPlanningRuntime();
    const timeBlock = await useCases.recordTimeBlockActual(body);

    return Response.json(timeBlock);
  } catch (error) {
    return errorResponse(error);
  }
}
