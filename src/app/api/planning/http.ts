import { PlanningUseCaseError } from "../../../domain/planning/use-cases";
import { TaskProviderError } from "../../../domain/tasks/provider";

export function errorResponse(error: unknown): Response {
  if (error instanceof PlanningUseCaseError) {
    return Response.json(
      {
        ok: false,
        error: error.message,
        code: error.code
      },
      { status: error.code === "PLANNING_PERIOD_NOT_FOUND" ? 404 : 422 }
    );
  }

  if (error instanceof TaskProviderError) {
    return Response.json(
      {
        ok: false,
        error: error.message,
        code: error.code
      },
      { status: 502 }
    );
  }

  if (error instanceof Error) {
    return Response.json(
      {
        ok: false,
        error: error.message
      },
      { status: 400 }
    );
  }

  return Response.json(
    {
      ok: false,
      error: "Planning request failed."
    },
    { status: 500 }
  );
}
