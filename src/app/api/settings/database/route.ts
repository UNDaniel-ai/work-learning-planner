import { z } from "zod";
import { getConfig } from "../../../../lib/config";
import {
  createDatabaseModeState,
  getDatabaseModeFromRequest,
  serializeDatabaseModeCookie
} from "../../../../lib/planning/database-mode";

const updateDatabaseModeSchema = z.object({
  mode: z.enum(["personal", "test"])
});

export async function GET(request: Request) {
  const config = getConfig();

  return Response.json(
    createDatabaseModeState(config, getDatabaseModeFromRequest(request))
  );
}

export async function POST(request: Request) {
  const config = getConfig();
  const body = updateDatabaseModeSchema.parse(await request.json());

  if (body.mode === "test" && !config.testDatabaseUrl) {
    return Response.json(
      {
        ok: false,
        error: "Test database is not configured."
      },
      { status: 400 }
    );
  }

  const response = Response.json(createDatabaseModeState(config, body.mode));
  response.headers.set("Set-Cookie", serializeDatabaseModeCookie(body.mode));

  return response;
}
