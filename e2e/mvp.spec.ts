import { expect, test } from "@playwright/test";

test("runs the planning loop from direction to export", async ({ page }) => {
  const suffix = Date.now();
  const goalTitle = `E2E planner goal ${suffix}`;
  const topicTitle = `E2E learning topic ${suffix}`;
  const blockNote = `E2E focus block ${suffix}`;
  const reviewWin = `E2E review win ${suffix}`;

  await page.goto("/goals");
  await expect(
    page.getByRole("heading", { name: "Goals & Learning" })
  ).toBeVisible();

  await page.getByLabel("Goal title").fill(goalTitle);
  await page.getByRole("button", { name: "Create goal" }).click();
  await expect(page.getByText(goalTitle, { exact: true })).toBeVisible();

  await page.getByRole("textbox", { name: "Learning topic" }).fill(topicTitle);
  await page.getByRole("button", { name: "Add learning topic" }).click();
  await expect(page.getByText(topicTitle, { exact: true })).toBeVisible();

  await page.goto("/weekly");
  await page.getByLabel(`Focus ${goalTitle}`).check();
  await page.getByRole("button", { name: "Create weekly plan" }).click();
  await expect(page.getByText("Week saved")).toBeVisible();

  const weeklyResponse = await page.request.get("/api/planning/weekly");
  expect(weeklyResponse.ok()).toBeTruthy();
  const weeklyData = (await weeklyResponse.json()) as {
    timeBlocks: Array<{ startsAt: string; endsAt: string }>;
  };
  const today = new Date().toISOString().slice(0, 10);
  const occupiedIntervals = weeklyData.timeBlocks
    .filter((block) => block.startsAt.startsWith(today))
    .map((block) => [toMinutes(block.startsAt), toMinutes(block.endsAt)]);
  const availableHour = Array.from({ length: 12 }, (_, index) => index + 6)
    .map((hour) => hour * 60)
    .find(
      (startMinutes) =>
        !occupiedIntervals.some(
          ([occupiedStart, occupiedEnd]) =>
            startMinutes < occupiedEnd && startMinutes + 60 > occupiedStart
        )
    );
  expect(availableHour).toBeDefined();
  const startTime = formatTimeInput(availableHour as number);
  const endTime = formatTimeInput((availableHour as number) + 60);

  await page.getByLabel("Start").fill(startTime);
  await page.getByLabel("End").fill(endTime);
  await page.getByLabel("Note").fill(blockNote);
  const timeBlockResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/api/planning/time-blocks") &&
      response.request().method() === "POST"
  );
  await page.getByRole("button", { name: "Add time block" }).click();
  expect((await timeBlockResponse).status()).toBe(201);
  await expect(page.getByText(blockNote, { exact: true })).toBeVisible();

  await page.goto("/today");
  await expect(page.getByText(blockNote, { exact: true })).toBeVisible();
  const blockRow = page.getByRole("listitem").filter({ hasText: blockNote });
  const actualTimeResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/api/planning/time-blocks") &&
      response.request().method() === "PATCH"
  );
  await blockRow.getByLabel(`Actual minutes for ${blockNote}`).fill("45");
  await blockRow.getByRole("button", { name: "Save actual time" }).click();
  expect((await actualTimeResponse).status()).toBe(200);
  await page.reload();
  await expect(
    page
      .getByRole("listitem")
      .filter({ hasText: blockNote })
      .getByText("45 min actual")
  ).toBeVisible();

  await page.goto("/review");
  await expect(
    page.getByRole("heading", { name: "Close the loop" })
  ).toBeVisible();
  await page.getByLabel("Wins").fill(reviewWin);
  await page.getByLabel("Misses").fill("E2E miss");
  await page.getByLabel("Adjustments").fill("E2E adjustment");
  await page.getByLabel("Actual minutes").fill("45");
  const reviewResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/api/planning/reviews") &&
      response.request().method() === "POST"
  );
  await page.getByRole("button", { name: "Save review" }).click();
  expect((await reviewResponse).status()).toBe(201);
  await expect(page.getByText(reviewWin, { exact: true })).toBeVisible();

  await page.goto("/settings");
  await expect(
    page.getByRole("link", { name: "Export planning data" })
  ).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "Export planning data" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe(
    "work-learning-planner-export.json"
  );
});

function toMinutes(value: string): number {
  const match = value.match(/T(\d{2}):(\d{2})/);

  if (!match) {
    throw new Error(`Expected an ISO date-time, received ${value}`);
  }

  return Number(match[1]) * 60 + Number(match[2]);
}

function formatTimeInput(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(remainingMinutes).padStart(
    2,
    "0"
  )}`;
}
