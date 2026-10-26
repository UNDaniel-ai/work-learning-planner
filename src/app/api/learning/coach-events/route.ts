import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getLearningRuntime } from "../../../../lib/learning/runtime";
import { learningErrorResponse } from "../http";

const coachEventSchema = z
  .object({
    id: z.string().min(1).optional(),
    sessionId: z.string().min(1),
    mode: z.enum([
      "socratic",
      "concept_hint",
      "debug_guide",
      "code_review",
      "synthesis",
      "recall_quiz",
      "direct_solution"
    ]),
    requestedAction: z
      .enum([
        "guidance",
        "todo_completion",
        "edit_assignment",
        "run_assignment_command"
      ])
      .default("guidance"),
    inputSummary: z.string().min(1).max(500),
    outputSummary: z.string().min(1).max(500).optional()
  })
  .strict();

export async function GET(request: Request) {
  try {
    const sessionId = new URL(request.url).searchParams.get("sessionId");

    if (!sessionId) {
      throw new Error("sessionId is required.");
    }

    const { repository } = await getLearningRuntime(request);
    return Response.json({
      coachEvents: await repository.listCoachEventsForSession(sessionId)
    });
  } catch (error) {
    return learningErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = coachEventSchema.parse(await request.json());
    const { useCases } = await getLearningRuntime(request);
    const event = await useCases.recordCoachEvent({
      ...body,
      id: body.id ?? randomUUID()
    });

    if (event.boundary === "blocked") {
      return Response.json(
        {
          ok: false,
          code: "COACH_BOUNDARY_BLOCKED",
          event
        },
        { status: 403 }
      );
    }

    return Response.json(event, { status: 201 });
  } catch (error) {
    return learningErrorResponse(error);
  }
}
