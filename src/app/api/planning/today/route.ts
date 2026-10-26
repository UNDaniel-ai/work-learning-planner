import { z } from "zod";
import { errorResponse } from "../http";
import { getPlanningRuntime } from "../../../../lib/planning/runtime";
import { getLearningRuntime } from "../../../../lib/learning/runtime";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const date = dateSchema.parse(
      url.searchParams.get("date") ?? new Date().toISOString().slice(0, 10)
    );
    const [{ repository, taskProvider }, learningRuntime] = await Promise.all([
      getPlanningRuntime(request),
      getLearningRuntime(request)
    ]);
    const planningPeriods = await repository.listPlanningPeriods();
    const planningPeriod =
      planningPeriods.find(
        (period) => period.startsOn <= date && date <= period.endsOn
      ) ?? null;

    if (!planningPeriod) {
      return Response.json({
        date,
        planningPeriod: null,
        timeBlocks: [],
        tasks: [],
        learningSessions: []
      });
    }

    const [allTimeBlocks, taskLinks, tasks] = await Promise.all([
      repository.listTimeBlocks(),
      repository.listTaskLinks(),
      taskProvider.listTasks()
    ]);
    const linkedTaskIds = new Set(
      taskLinks
        .filter((taskLink) =>
          planningPeriod.taskLinkIds.includes(taskLink.id)
        )
        .map((taskLink) => taskLink.externalTaskId)
    );
    const todayTimeBlocks = allTimeBlocks.filter(
      (timeBlock) =>
        timeBlock.periodId === planningPeriod.id &&
        timeBlock.startsAt.slice(0, 10) === date
    );
    const learningSessions =
      await learningRuntime.repository.listSessionSummaries({
        timeBlockIds: todayTimeBlocks.map((timeBlock) => timeBlock.id)
      });

    return Response.json({
      date,
      planningPeriod,
      timeBlocks: todayTimeBlocks,
      tasks: tasks.filter((task) => linkedTaskIds.has(task.id)),
      learningSessions
    });
  } catch (error) {
    return errorResponse(error);
  }
}
