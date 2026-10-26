import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getLearningRuntime } from "../../../../lib/learning/runtime";
import { learningErrorResponse } from "../http";

const createSessionSchema = z.object({
  id: z.string().min(1).optional(),
  moduleId: z.string().min(1),
  planningPeriodId: z.string().min(1).optional(),
  timeBlockId: z.string().min(1).optional(),
  taskLinkId: z.string().min(1).optional(),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  question: z.string().min(1),
  preUnderstanding: z.string().min(1)
});

export async function GET(request?: Request) {
  try {
    const { repository } = await getLearningRuntime(request);
    const moduleId = request
      ? new URL(request.url).searchParams.get("moduleId")
      : null;
    const sessions = moduleId
      ? await repository.listSessionsForModule(moduleId)
      : await repository.listSessions();

    return Response.json({ sessions });
  } catch (error) {
    return learningErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = createSessionSchema.parse(await request.json());
    const { useCases } = await getLearningRuntime(request);
    const session = await useCases.createSession({
      ...body,
      id: body.id ?? randomUUID()
    });

    return Response.json(session, { status: 201 });
  } catch (error) {
    return learningErrorResponse(error);
  }
}
