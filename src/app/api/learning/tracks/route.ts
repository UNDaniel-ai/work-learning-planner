import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getLearningRuntime } from "../../../../lib/learning/runtime";
import { learningErrorResponse } from "../http";

const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const createModuleSchema = z.object({
  id: z.string().min(1).optional(),
  slug: slugSchema,
  title: z.string().min(1),
  sequence: z.number().int().positive(),
  expectedOutcome: z.string().min(1),
  acceptanceCriteria: z.array(z.string().min(1)).min(1)
});
const createTrackSchema = z.object({
  id: z.string().min(1).optional(),
  sourceId: z.string().min(1),
  learningTopicId: z.string().min(1).optional(),
  sourceSlug: slugSchema,
  title: z.string().min(1),
  objective: z.string().min(1),
  modules: z.array(createModuleSchema).default([])
});

export async function GET(request?: Request) {
  try {
    const { repository } = await getLearningRuntime(request);
    return Response.json({ tracks: await repository.listTracks() });
  } catch (error) {
    return learningErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = createTrackSchema.parse(await request.json());
    const { useCases } = await getLearningRuntime(request);
    const result = await useCases.createTrack({
      ...body,
      id: body.id ?? randomUUID(),
      modules: body.modules.map((learningModule) => ({
        ...learningModule,
        id: learningModule.id ?? randomUUID()
      }))
    });

    return Response.json(result, { status: 201 });
  } catch (error) {
    return learningErrorResponse(error);
  }
}
