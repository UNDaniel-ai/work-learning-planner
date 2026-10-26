import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getLearningRuntime } from "../../../../../../lib/learning/runtime";
import { learningErrorResponse } from "../../../http";

type RouteContext = {
  params: Promise<{ sessionId: string }>;
};

const createEvidenceSchema = z.object({
  id: z.string().min(1).optional(),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  kind: z.enum([
    "test",
    "error",
    "toy_example",
    "shape_check",
    "performance",
    "commit",
    "source_quote",
    "manual_summary"
  ]),
  title: z.string().min(1),
  summary: z.string().min(1),
  reference: z.string().min(1),
  result: z.enum(["pass", "fail", "observed", "unknown"])
});

export async function GET(request: Request, context: RouteContext) {
  try {
    const { sessionId } = await context.params;
    const { repository } = await getLearningRuntime(request);
    return Response.json({
      evidence: await repository.listEvidenceForSession(sessionId)
    });
  } catch (error) {
    return learningErrorResponse(error);
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { sessionId } = await context.params;
    const body = createEvidenceSchema.parse(await request.json());
    const { useCases } = await getLearningRuntime(request);
    const evidence = await useCases.addEvidence({
      ...body,
      id: body.id ?? randomUUID(),
      sessionId
    });

    return Response.json(evidence, { status: 201 });
  } catch (error) {
    return learningErrorResponse(error);
  }
}
