import { getPlanningRuntime } from "../../../lib/planning/runtime";
import { serializePlanningData } from "../../../lib/planning/export";

export async function GET() {
  try {
    const runtime = await getPlanningRuntime();
    const data = await runtime.repository.exportPlanningData();

    return new Response(serializePlanningData(data), {
      status: 200,
      headers: {
        "Content-Disposition":
          'attachment; filename="work-learning-planner-export.json"',
        "Content-Type": "application/json; charset=utf-8"
      }
    });
  } catch {
    return Response.json(
      {
        ok: false,
        error: "Planning data export failed."
      },
      { status: 500 }
    );
  }
}
