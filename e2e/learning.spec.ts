import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";

test("runs the CS336 learning loop in the test workspace", async ({ page }, testInfo) => {
  const suffix = Date.now();
  const question = `E2E mask question ${suffix}`;
  const sessionSlug = `e2e-mask-${suffix}`;
  const evidenceTitle = `E2E failing mask check ${suffix}`;
  const evidenceSlug = `e2e-mask-failure-${suffix}`;
  const cardTitle = `E2E mask card ${suffix}`;
  const cardSlug = `e2e-mask-card-${suffix}`;
  const reviewPrompt = `Why mask before softmax ${suffix}?`;

  await page.goto("/settings");
  const databaseSwitch = page.getByRole("switch", {
    name: "Use test database"
  });
  if (!(await databaseSwitch.isChecked())) {
    await page.getByText("Use test database", { exact: true }).click();
  }
  await expect(databaseSwitch).toBeChecked();

  const seedResponse = await page.request.post("/api/learning/seed/cs336");
  expect(seedResponse.status()).toBe(201);
  const seed = (await seedResponse.json()) as {
    track: { id: string };
    modules: Array<{ id: string; title: string }>;
  };
  expect(seed.modules).toHaveLength(8);

  await page.goto("/weekly");
  const weeklyResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/planning/weekly") &&
      response.request().method() === "POST"
  );
  await page.getByRole("button", { name: "Create weekly plan" }).click();
  const weeklyResponse = await weeklyResponsePromise;
  expect(weeklyResponse.status()).toBe(201);
  const period = (await weeklyResponse.json()) as { id: string };

  await page.goto(`/learning/${seed.track.id}`);
  await expect(
    page
      .getByLabel("Module", { exact: true })
      .locator('option[value="module-cs336-attention"]')
  ).toHaveText("Attention, mask, and RoPE");
  await page
    .getByLabel("Module", { exact: true })
    .selectOption("module-cs336-attention");
  await page.getByLabel("Session slug").fill(sessionSlug);
  await page.getByLabel("Study question").fill(question);
  await page
    .getByLabel("Current understanding")
    .fill("The causal mask should modify logits before normalization.");
  const sessionResponsePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/learning/sessions") &&
      response.request().method() === "POST"
  );
  await page.getByRole("button", { name: "Start study session" }).click();
  const sessionResponse = await sessionResponsePromise;
  expect(sessionResponse.status()).toBe(201);
  const session = (await sessionResponse.json()) as {
    id: string;
    planningPeriodId?: string;
  };
  expect(session.planningPeriodId).toBe(period.id);
  await page.getByRole("link", { name: question }).click();

  await page.getByRole("button", { name: "Start" }).click();
  await page.getByLabel("Evidence title").fill(evidenceTitle);
  await page.getByLabel("Evidence slug").fill(evidenceSlug);
  await page
    .getByLabel("Evidence summary")
    .fill("The toy tensor exposed the wrong mask order.");
  await page
    .getByLabel("Evidence reference")
    .fill("tests/test_attention.py::test_causal_mask");
  await page.getByLabel("Evidence result").selectOption("fail");
  await page.getByRole("button", { name: "Add evidence" }).click();
  await expect(page.getByText(evidenceTitle, { exact: true })).toBeVisible();

  await page.getByLabel("Coach mode").selectOption("debug_guide");
  await page
    .getByLabel("Coach request summary")
    .fill("Asked how to isolate the mask-order failure.");
  await page
    .getByLabel("Coach output summary")
    .fill("Suggested comparing logits before and after masking.");
  await page
    .getByRole("button", { name: "Record coach interaction" })
    .click();
  await expect(
    page.getByText("Suggested comparing logits before and after masking.")
  ).toBeVisible();

  await page.getByRole("button", { name: "Complete" }).click();
  await page.getByLabel("Card title").fill(cardTitle);
  await page.getByLabel("Card slug").fill(cardSlug);
  await page
    .getByLabel("Card summary")
    .fill("Causal masks remove forbidden logits before softmax.");
  await page.getByLabel("Review prompt").fill(reviewPrompt);
  await page.getByRole("button", { name: "Promote knowledge card" }).click();
  await page.getByRole("link", { name: cardTitle }).click();

  await page
    .getByLabel("Recall answer")
    .fill("Masking before softmax gives forbidden positions zero probability.");
  await page.getByLabel("Recall score").selectOption("4");
  await page.getByRole("button", { name: "Save recall" }).click();
  await expect(page.getByText(/Next review/)).toBeVisible();
  await page.getByRole("button", { name: "Advance to understood" }).click();
  await expect(page.getByText("understood", { exact: true })).toBeVisible();

  const reviewResponse = await page.request.get(
    `/api/planning/reviews?periodId=${encodeURIComponent(period.id)}`
  );
  expect(reviewResponse.ok()).toBeTruthy();
  const review = (await reviewResponse.json()) as {
    learning: {
      sessions: Array<{ session: { id: string } }>;
      evidence: Array<{ title: string; result: string }>;
      knowledgeCards: Array<{ title: string }>;
    };
  };
  expect(review.learning.sessions.map((item) => item.session.id)).toContain(
    session.id
  );
  expect(review.learning.evidence).toContainEqual(
    expect.objectContaining({ title: evidenceTitle, result: "fail" })
  );
  expect(review.learning.knowledgeCards).toContainEqual(
    expect.objectContaining({ title: cardTitle })
  );

  await page.goto("/review");
  await expect(
    page.getByRole("heading", { name: "Learning outcomes" })
  ).toBeVisible();

  await page.goto("/settings");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "Export planning data" }).click();
  const download = await downloadPromise;
  const downloadPath = await download.path();
  expect(downloadPath).not.toBeNull();
  const exported = JSON.parse(
    await readFile(downloadPath as string, "utf8")
  ) as {
    learning: {
      sessions: Array<{ id: string }>;
      evidence: Array<{ title: string; result: string }>;
      knowledgeCards: Array<{
        id: string;
        title: string;
        markdownPath?: string;
      }>;
    };
  };
  expect(exported.learning.sessions.map((item) => item.id)).toContain(
    session.id
  );
  expect(exported.learning.evidence).toContainEqual(
    expect.objectContaining({ title: evidenceTitle, result: "fail" })
  );
  expect(exported.learning.knowledgeCards).toContainEqual(
    expect.objectContaining({
      title: cardTitle,
      markdownPath: expect.stringMatching(/^temp\/e2e-learning-assets\//)
    })
  );
  expect(JSON.stringify(exported)).not.toContain("assignment-source-code");

  const exportedCard = exported.learning.knowledgeCards.find(
    (item) => item.title === cardTitle
  );
  expect(exportedCard).toBeDefined();
  const visualRoutes = [
    { path: "/learning", heading: "Learning", screenshot: true },
    {
      path: `/learning/${seed.track.id}`,
      heading: "Path workspace",
      screenshot: false
    },
    {
      path: `/learning/sessions/${session.id}`,
      heading: "Question to evidence",
      screenshot: true
    },
    {
      path: `/learning/cards/${exportedCard?.id}`,
      heading: "Recall and mature",
      screenshot: false
    }
  ];

  for (const viewport of [
    { name: "desktop", width: 1440, height: 1000 },
    { name: "mobile", width: 390, height: 844 }
  ]) {
    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height
    });

    for (const route of visualRoutes) {
      await page.goto(route.path);
      await expect(
        page.getByRole("heading", { name: route.heading, exact: true })
      ).toBeVisible();
      await expect
        .poll(() => page.locator("text=Loading").count())
        .toBe(0);
      const overflow = await page.evaluate(() => ({
        viewport: window.innerWidth,
        document: document.documentElement.scrollWidth,
        body: document.body.scrollWidth
      }));

      expect(Math.max(overflow.document, overflow.body)).toBeLessThanOrEqual(
        overflow.viewport
      );
      if (route.screenshot) {
        await page.screenshot({
          fullPage: true,
          path: testInfo.outputPath(
            `${viewport.name}-${route.heading.toLowerCase().replaceAll(" ", "-")}.png`
          )
        });
      }
    }
  }
});
