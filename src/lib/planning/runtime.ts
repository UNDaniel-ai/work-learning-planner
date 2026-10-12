import { createMemoryTaskProvider } from "../../integrations/memory/provider";
import { createVikunjaTaskProvider } from "../../integrations/vikunja/provider";
import { getConfig } from "../config";
import {
  getDatabaseModeFromRequest,
  getDatabaseUrlForMode,
  type DatabaseMode
} from "./database-mode";
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
  databaseMode: DatabaseMode;
  databaseUrl: string;
  connection: PlannerDatabaseConnection;
  repository: PlanningRepository;
  taskProvider: TaskProvider;
  useCases: PlanningUseCases;
};

type RuntimeInput = Request | { databaseMode?: DatabaseMode };

const runtimePromises = new Map<string, Promise<PlannerRuntime>>();

export function getPlanningRuntime(
  input?: RuntimeInput
): Promise<PlannerRuntime> {
  const config = getConfig();
  const databaseMode = getRuntimeDatabaseMode(input);
  const databaseUrl = getDatabaseUrlForMode(config, databaseMode);
  const runtimeKey = `${databaseMode}:${databaseUrl}`;

  if (!runtimePromises.has(runtimeKey)) {
    runtimePromises.set(
      runtimeKey,
      createRuntime({
        databaseMode,
        databaseUrl
      })
    );
  }

  return runtimePromises.get(runtimeKey) as Promise<PlannerRuntime>;
}

async function createRuntime(input: {
  databaseMode: DatabaseMode;
  databaseUrl: string;
}): Promise<PlannerRuntime> {
  const config = getConfig();
  const connection = createPlannerDatabase({
    url: input.databaseUrl,
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
    databaseMode: input.databaseMode,
    databaseUrl: input.databaseUrl,
    connection,
    repository,
    taskProvider,
    useCases: createPlanningUseCases({
      repository,
      taskProvider
    })
  };
}

function getRuntimeDatabaseMode(input?: RuntimeInput): DatabaseMode {
  if (!input) {
    return "personal";
  }

  if (isRequestInput(input)) {
    return getDatabaseModeFromRequest(input);
  }

  return input.databaseMode ?? "personal";
}

function isRequestInput(input: RuntimeInput): input is Request {
  return "headers" in input;
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
