import { z } from "zod";
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

const updateTaskSchema = z.object({
  id: z.string().min(1),
  action: z.enum(["complete", "postpone"]),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
});

export async function PATCH(request: Request) {
  try {
    const body = updateTaskSchema.parse(await request.json());
    const { taskProvider } = await getPlanningRuntime();

    if (body.action === "complete") {
      return Response.json(await taskProvider.completeTask(body.id));
    }

    if (!body.dueDate) {
      throw new Error("A dueDate is required to postpone a task.");
    }

    return Response.json(
      await taskProvider.postponeTask(body.id, body.dueDate)
    );
  } catch (error) {
    return errorResponse(error);
  }
}
