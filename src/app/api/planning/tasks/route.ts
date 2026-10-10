import { errorResponse } from "../http";
import { getPlanningRuntime } from "../../../../lib/planning/runtime";

export async function GET() {
  try {
    const { taskProvider } = await getPlanningRuntime();

    return Response.json({
      tasks: await taskProvider.listTasks({ status: "open" })
    });
  } catch (error) {
    return errorResponse(error);
  }
}
