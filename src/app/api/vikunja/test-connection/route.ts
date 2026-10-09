import { getConfig } from "../../../../lib/config";
import { createVikunjaTaskProvider } from "../../../../integrations/vikunja/provider";

export async function GET() {
  const config = getConfig();

  if (!config.vikunja.baseUrl || !config.vikunja.apiToken) {
    return Response.json(
      {
        ok: false,
        connected: false,
        error: "Vikunja configuration is incomplete."
      },
      { status: 503 }
    );
  }

  try {
    const provider = createVikunjaTaskProvider({
      baseUrl: config.vikunja.baseUrl,
      apiToken: config.vikunja.apiToken
    });
    const tasks = await provider.listTasks();

    return Response.json({
      ok: true,
      connected: true,
      taskCount: tasks.length
    });
  } catch {
    return Response.json(
      {
        ok: false,
        connected: false,
        error: "Vikunja connection failed."
      },
      { status: 502 }
    );
  }
}
