export async function getJson<T>(url: string): Promise<T> {
  return readJson<T>(await fetch(url));
}

export async function postJson<T>(url: string, body: unknown): Promise<T> {
  return requestJson<T>(url, "POST", body);
}

export async function patchJson<T>(url: string, body: unknown): Promise<T> {
  return requestJson<T>(url, "PATCH", body);
}

async function requestJson<T>(
  url: string,
  method: "POST" | "PATCH",
  body: unknown
): Promise<T> {
  return readJson<T>(
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    })
  );
}

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const payload = (await response.json().catch(() => undefined)) as
      | { error?: string }
      | undefined;
    throw new Error(payload?.error ?? `Learning request failed with ${response.status}.`);
  }

  return response.json() as Promise<T>;
}

export function getClientErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Learning data failed to load.";
}
