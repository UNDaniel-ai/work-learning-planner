import { z } from "zod";

const optionalNonEmptyString = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().min(1).optional()
);

const optionalUrl = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().url().optional()
);

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  VIKUNJA_BASE_URL: optionalUrl,
  VIKUNJA_API_TOKEN: optionalNonEmptyString
});

export type AppConfig = {
  databaseUrl: string;
  vikunja: {
    baseUrl?: string;
    apiToken?: string;
  };
};

export function getConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = envSchema.safeParse(env);

  if (!parsed.success) {
    const message = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");

    throw new Error(`Invalid application configuration: ${message}`);
  }

  return {
    databaseUrl: parsed.data.DATABASE_URL,
    vikunja: {
      baseUrl: parsed.data.VIKUNJA_BASE_URL,
      apiToken: parsed.data.VIKUNJA_API_TOKEN
    }
  };
}
