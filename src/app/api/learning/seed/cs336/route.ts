import { getLearningRuntime } from "../../../../../lib/learning/runtime";
import { seedCs336LearningPath } from "../../../../../lib/learning/seeds";
import { getDatabaseModeFromRequest } from "../../../../../lib/planning/database-mode";
import { learningErrorResponse } from "../../http";

export async function POST(request: Request) {
  try {
    const databaseMode = getDatabaseModeFromRequest(request);

    if (databaseMode !== "test") {
      return Response.json(
        {
          ok: false,
          error: "CS336 seed is restricted to the test database."
        },
        { status: 403 }
      );
    }

    const runtime = await getLearningRuntime(request);
    const result = await seedCs336LearningPath({
      databaseMode,
      repository: runtime.repository,
      useCases: runtime.useCases
    });

    return Response.json(result, { status: 201 });
  } catch (error) {
    return learningErrorResponse(error);
  }
}
