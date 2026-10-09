import {
  TaskProviderError,
  type TaskProviderErrorCode
} from "../../domain/tasks/provider";

type FetchLike = typeof fetch;

export type VikunjaClient = {
  get(path: string, options?: RequestOptions): Promise<unknown>;
  post(path: string, body: unknown, options?: RequestOptions): Promise<unknown>;
  patch(path: string, body: unknown, options?: RequestOptions): Promise<unknown>;
};

export type CreateVikunjaClientInput = {
  baseUrl: string;
  apiToken: string;
  fetch?: FetchLike;
};

type RequestOptions = {
  query?: Record<string, string | number | boolean | undefined>;
};

type RequestInput = RequestOptions & {
  method: string;
  body?: unknown;
  contentType?: string;
};

export function createVikunjaClient(
  input: CreateVikunjaClientInput
): VikunjaClient {
  const baseUrl = normalizeVikunjaBaseUrl(input.baseUrl);
  const fetchImpl = input.fetch ?? fetch;

  async function request(path: string, requestInput: RequestInput) {
    const url = createUrl(baseUrl, path, requestInput.query);
    const headers: Record<string, string> = {
      Accept: "application/json",
      Authorization: `Bearer ${input.apiToken}`
    };

    if (requestInput.body !== undefined) {
      headers["Content-Type"] = requestInput.contentType ?? "application/json";
    }

    let response: Response;

    try {
      response = await fetchImpl(url, {
        method: requestInput.method,
        headers,
        body:
          requestInput.body === undefined
            ? undefined
            : JSON.stringify(requestInput.body)
      });
    } catch (error) {
      throw new TaskProviderError(
        "PROVIDER_UNAVAILABLE",
        "vikunja",
        `Vikunja request failed: ${String(error)}`
      );
    }

    if (!response.ok) {
      throw await toProviderError(response);
    }

    if (response.status === 204) {
      return undefined;
    }

    return response.json();
  }

  return {
    get(path, options) {
      return request(path, { ...options, method: "GET" });
    },
    post(path, body, options) {
      return request(path, { ...options, method: "POST", body });
    },
    patch(path, body, options) {
      return request(path, {
        ...options,
        method: "PATCH",
        body,
        contentType: "application/merge-patch+json"
      });
    }
  };
}

function normalizeVikunjaBaseUrl(baseUrl: string): string {
  const trimmed = baseUrl.replace(/\/+$/, "");

  return trimmed.endsWith("/api/v2") ? trimmed : `${trimmed}/api/v2`;
}

function createUrl(
  baseUrl: string,
  path: string,
  query: RequestOptions["query"] = {}
): string {
  const url = new URL(`${baseUrl}${path}`);

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

async function toProviderError(response: Response): Promise<TaskProviderError> {
  const status = response.status;
  const problem = await readProblem(response);
  const message = problem?.title ?? `Vikunja request failed with ${status}.`;
  const code: TaskProviderErrorCode =
    status === 404
      ? "TASK_NOT_FOUND"
      : status === 400
        ? "VALIDATION_ERROR"
        : "PROVIDER_UNAVAILABLE";

  return new TaskProviderError(code, "vikunja", message);
}

async function readProblem(response: Response): Promise<{ title?: string } | undefined> {
  try {
    return (await response.json()) as { title?: string };
  } catch {
    return undefined;
  }
}
