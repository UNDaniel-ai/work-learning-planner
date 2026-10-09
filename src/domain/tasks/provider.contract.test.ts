import { describe, expect, it } from "vitest";
import { createMemoryTaskProvider } from "../../integrations/memory/provider";
import type { TaskProvider } from "./provider";

function runTaskProviderContract(
  providerName: string,
  createProvider: () => TaskProvider
) {
  describe(`${providerName} TaskProvider contract`, () => {
    it("creates and lists open tasks", async () => {
      const provider = createProvider();

      const created = await provider.createTask({
        title: "  Draft weekly plan  ",
        projectId: "project-1",
        dueDate: "2026-10-10",
        labels: ["work", "planning"]
      });

      await expect(provider.listTasks()).resolves.toEqual([
        {
          id: created.id,
          title: "Draft weekly plan",
          status: "open",
          projectId: "project-1",
          dueDate: "2026-10-10",
          labels: ["work", "planning"],
          createdAt: "2026-10-09T00:00:00.000Z",
          updatedAt: "2026-10-09T00:00:00.000Z"
        }
      ]);
    });

    it("rejects blank task titles", async () => {
      const provider = createProvider();

      await expect(provider.createTask({ title: "  " })).rejects.toThrow(
        /title/i
      );
    });

    it("updates task title, due date, and labels", async () => {
      const provider = createProvider();
      const created = await provider.createTask({ title: "Draft plan" });

      const updated = await provider.updateTask(created.id, {
        title: "Review plan",
        dueDate: "2026-10-11",
        labels: ["learning"]
      });

      expect(updated).toMatchObject({
        id: created.id,
        title: "Review plan",
        dueDate: "2026-10-11",
        labels: ["learning"],
        status: "open"
      });
    });

    it("completes a task", async () => {
      const provider = createProvider();
      const created = await provider.createTask({ title: "Finish setup" });

      const completed = await provider.completeTask(created.id);

      expect(completed).toMatchObject({
        id: created.id,
        status: "completed",
        completedAt: "2026-10-09T00:00:00.000Z"
      });
    });

    it("postpones a task due date", async () => {
      const provider = createProvider();
      const created = await provider.createTask({
        title: "Study TypeScript",
        dueDate: "2026-10-09"
      });

      const postponed = await provider.postponeTask(created.id, "2026-10-12");

      expect(postponed).toMatchObject({
        id: created.id,
        dueDate: "2026-10-12"
      });
    });

    it("reports missing tasks with a typed provider error", async () => {
      const provider = createProvider();

      await expect(provider.completeTask("missing-task")).rejects.toMatchObject({
        code: "TASK_NOT_FOUND",
        provider: providerName
      });
    });
  });
}

runTaskProviderContract("memory", () =>
  createMemoryTaskProvider({
    now: () => "2026-10-09T00:00:00.000Z"
  })
);
