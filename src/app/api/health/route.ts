import { getConfig } from "../../../lib/config";

export async function GET() {
  let vikunjaConfigured = false;

  try {
    const config = getConfig();
    vikunjaConfigured = Boolean(
      config.vikunja.baseUrl && config.vikunja.apiToken
    );
  } catch {
    vikunjaConfigured = false;
  }

  return Response.json({
    ok: true,
    app: "work-learning-planner",
    vikunjaConfigured
  });
}
