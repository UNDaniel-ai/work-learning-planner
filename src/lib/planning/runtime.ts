import { createMemoryTaskProvider } from "../../integrations/memory/provider";
import { createVikunjaTaskProvider } from "../../integrations/vikunja/provider";
import { getConfig } from "../config";
import {
  createPlannerDatabase,
  migratePlannerDatabase,
  type PlannerDatabaseConnection
} from "../db/client";
import {
  createPlanningRepository,
  type PlanningRepository
} from "../db/repositories";
import {
  createPlanningUseCases,
  type PlanningUseCases
} from "../../domain/planning/use-cases";
import type { Area } from "../../domain/planning/types";
import type { TaskProvider } from "../../domain/tasks/provider";

export type PlannerRuntime = {
  connection: PlannerDatabaseConnection;
  repository: PlanningRepository;
  taskProvider: TaskProvider;
  useCases: PlanningUseCases;
};

let runtimePromise: Promise<PlannerRuntime> | undefined;

export function getPlanningRuntime(): Promise<PlannerRuntime> {
  runtimePromise ??= createRuntime();

  return runtimePromise;
}

async function createRuntime(): Promise<PlannerRuntime> {
  const config = getConfig();
  const connection = createPlannerDatabase({
    url: config.databaseUrl,
    authToken: undefined
  });

  await migratePlannerDatabase(connection.db);

  const repository = createPlanningRepository(connection.db);
  await ensureDefaultAreas(repository);

  const taskProvider =
    config.vikunja.baseUrl && config.vikunja.apiToken
      ? createVikunjaTaskProvider({
          baseUrl: config.vikunja.baseUrl,
          apiToken: config.vikunja.apiToken
        })
      : createMemoryTaskProvider();

  return {
    connection,
    repository,
    taskProvider,
    useCases: createPlanningUseCases({
      repository,
      taskProvider
    })
  };
}

async function ensureDefaultAreas(repository: PlanningRepository): Promise<void> {
  const existingAreas = await repository.listAreas();
  const areaIds = new Set(existingAreas.map((area) => area.id));
  const defaultAreas: Area[] = [
    { id: "area-work", name: "Work", kind: "work" },
    { id: "area-learning", name: "Learning", kind: "learning" }
  ];

  for (const area of defaultAreas) {
    if (!areaIds.has(area.id)) {
      await repository.createArea(area);
    }
  }
}
