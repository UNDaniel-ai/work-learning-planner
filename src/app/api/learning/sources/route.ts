import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getLearningRuntime } from "../../../../lib/learning/runtime";
import { learningErrorResponse } from "../http";

const sourceKinds = [
  "course",
  "paper",
  "book",
  "repo",
  "article",
  "video",
  "project"
] as const;

const createSourceSchema = z.object({
  id: z.string().min(1).optional(),
  title: z.string().min(1),
  kind: z.enum(sourceKinds),
  url: z.url(),
  repositoryUrl: z.url().optional(),
  revision: z.string().min(1).optional(),
  license: z.string().min(1).optional(),
  aiGuidance: z.enum(["open", "coach_only", "restricted"]),
  summary: z.string().min(1).optional()
});

export async function GET(request?: Request) {
  try {
    const { repository } = await getLearningRuntime(request);
    return Response.json({ sources: await repository.listSources() });
  } catch (error) {
    return learningErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = createSourceSchema.parse(await request.json());
    const { useCases } = await getLearningRuntime(request);
    const source = await useCases.createSource({
      ...body,
      id: body.id ?? randomUUID()
    });

    return Response.json(source, { status: 201 });
  } catch (error) {
    return learningErrorResponse(error);
  }
}
