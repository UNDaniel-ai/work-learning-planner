import { migrate } from "drizzle-orm/libsql/migrator";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import type { Client } from "@libsql/client";
import * as schema from "./schema";

export type PlannerDatabase = LibSQLDatabase<typeof schema>;

export type PlannerDatabaseConnection = {
  db: PlannerDatabase;
  client: Client;
  close(): void;
};

type CreatePlannerDatabaseInput = {
  url: string;
  authToken?: string;
};

export function createPlannerDatabase(
  input: CreatePlannerDatabaseInput
): PlannerDatabaseConnection {
  const db = drizzle({
    connection: {
      url: input.url,
      authToken: input.authToken
    },
    schema
  });

  return {
    db,
    client: db.$client,
    close: () => db.$client.close()
  };
}

export async function migratePlannerDatabase(
  db: PlannerDatabase,
  migrationsFolder = "drizzle"
): Promise<void> {
  await migrate(db, { migrationsFolder });
}
