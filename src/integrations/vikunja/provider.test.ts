import { describe, expect, it, vi } from "vitest";
import { TaskProviderError } from "../../domain/tasks/provider";
import { createVikunjaTaskProvider } from "./provider";

describe("VikunjaTaskProvider", () => {
  it("lists open tasks through the v2 paginated task endpoint", async () => {
    const fetchMock = createFetchMock([
      jsonResponse(
        {
          items: [
            vikunjaTask({
              id: 42,
              title: "Draft weekly plan",
              done: false,
              due_date: "2026-10-10T00:00:00Z",
              labels: [{ title: "work" }, { title: "planning" }],
              project_id: 7,
              priority: 3
            })
          ],
          page: 1,
          per_page: 50,
          total: 1,
          total_pages: 1
        },
        200
      )
    ]);
    const provider = createVikunjaTaskProvider({
      baseUrl: "https://vikunja.example.test",
      apiToken: "secret-token",
      fetch: fetchMock
    });

    await expect(provider.listTasks({ status: "open" })).resolves.toEqual([
      {
        id: "42",
        title: "Draft weekly plan",
        status: "open",
        projectId: "7",
        dueDate: "2026-10-10",
        labels: ["work", "planning"],
        priority: 3,
        createdAt: "2026-10-09T00:00:00Z",
        updatedAt: "2026-10-09T00:00:00Z"
      }
    ]);

    const [url, init] = fetchMock.mock.calls[0];
    const requestUrl = new URL(String(url));

    expect(requestUrl.pathname).toBe("/api/v2/tasks");
    expect(requestUrl.searchParams.get("filter")).toBe("done = false");
    expect(init?.headers).toMatchObject({
      Authorization: "Bearer secret-token"
    });
  });

  it("creates, completes, and postpones tasks with v2 task payloads", async () => {
    const fetchMock = createFetchMock([
      jsonResponse(vikunjaTask({ id: 43, title: "Draft plan" }), 201),
      jsonResponse(vikunjaTask({ id: 43, title: "Draft plan", done: true }), 200),
      jsonResponse(
        vikunjaTask({
          id: 43,
          title: "Draft plan",
          due_date: "2026-10-12T00:00:00.000Z"
        }),
        200
      )
    ]);
    const provider = createVikunjaTaskProvider({
      baseUrl: "https://vikunja.example.test/api/v2",
      apiToken: "secret-token",
      defaultProjectId: "7",
      fetch: fetchMock
    });

    await expect(
      provider.createTask({
        title: "Draft plan",
        dueDate: "2026-10-10",
        description: "Markdown body",
        priority: 2
      })
    ).resolves.toMatchObject({
      id: "43",
      title: "Draft plan",
      status: "open"
    });
    await expect(provider.completeTask("43")).resolves.toMatchObject({
      id: "43",
      status: "completed"
    });
    await expect(provider.postponeTask("43", "2026-10-12")).resolves.toMatchObject({
      id: "43",
      dueDate: "2026-10-12"
    });

    const [createUrl, createInit] = fetchMock.mock.calls[0];
    expect(String(createUrl)).toBe(
      "https://vikunja.example.test/api/v2/projects/7/tasks?format=markdown"
    );
    expect(createInit?.method).toBe("POST");
    expect(JSON.parse(String(createInit?.body))).toMatchObject({
      title: "Draft plan",
      due_date: "2026-10-10T00:00:00.000Z",
      description: "Markdown body",
      priority: 2
    });

    const [completeUrl, completeInit] = fetchMock.mock.calls[1];
    expect(String(completeUrl)).toBe(
      "https://vikunja.example.test/api/v2/tasks/43?format=markdown"
    );
    expect(completeInit?.method).toBe("PATCH");
    expect(completeInit?.headers).toMatchObject({
      "Content-Type": "application/merge-patch+json"
    });
    expect(JSON.parse(String(completeInit?.body))).toEqual({ done: true });

    const [, postponeInit] = fetchMock.mock.calls[2];
    expect(JSON.parse(String(postponeInit?.body))).toEqual({
      due_date: "2026-10-12T00:00:00.000Z"
    });
  });

  it("maps HTTP, network, and schema failures to provider errors", async () => {
    const notFoundProvider = createVikunjaTaskProvider({
      baseUrl: "https://vikunja.example.test",
      apiToken: "secret-token",
      fetch: createFetchMock([
        jsonResponse({ status: 404, title: "Not found" }, 404)
      ])
    });
    await expect(notFoundProvider.completeTask("404")).rejects.toMatchObject({
      code: "TASK_NOT_FOUND",
      provider: "vikunja"
    });

    const unauthorizedProvider = createVikunjaTaskProvider({
      baseUrl: "https://vikunja.example.test",
      apiToken: "secret-token",
      fetch: createFetchMock([
        jsonResponse({ status: 401, title: "Unauthorized" }, 401)
      ])
    });
    await expect(unauthorizedProvider.listTasks()).rejects.toMatchObject({
      code: "PROVIDER_UNAVAILABLE",
      provider: "vikunja"
    });

    const networkProvider = createVikunjaTaskProvider({
      baseUrl: "https://vikunja.example.test",
      apiToken: "secret-token",
      fetch: vi.fn(async () => {
        throw new TypeError("network down");
      }) as typeof fetch
    });
    await expect(networkProvider.listTasks()).rejects.toMatchObject({
      code: "PROVIDER_UNAVAILABLE",
      provider: "vikunja"
    });

    const schemaMismatchProvider = createVikunjaTaskProvider({
      baseUrl: "https://vikunja.example.test",
      apiToken: "secret-token",
      fetch: createFetchMock([jsonResponse({ items: [{ id: 1 }] }, 200)])
    });
    await expect(schemaMismatchProvider.listTasks()).rejects.toBeInstanceOf(
      TaskProviderError
    );
  });
});

function vikunjaTask(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    title: "Task",
    done: false,
    labels: [],
    created: "2026-10-09T00:00:00Z",
    updated: "2026-10-09T00:00:00Z",
    ...overrides
  };
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}

function createFetchMock(responses: Response[]): typeof fetch & {
  mock: ReturnType<typeof vi.fn>["mock"];
} {
  const fetchMock = vi.fn(async () => {
    const response = responses.shift();

    if (!response) {
      throw new Error("Unexpected fetch call.");
    }

    return response;
  });

  return fetchMock as unknown as typeof fetch & {
    mock: ReturnType<typeof vi.fn>["mock"];
  };
}
