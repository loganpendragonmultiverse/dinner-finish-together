import { test, expect } from "@playwright/test";
import { example, APP } from "../src/core.js";
const key = `${APP}:v1`;
test("meal editing, exact schedule, conflict and timer survive reload", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.getByRole("button", { name: "Load example", exact: true }).click();
  await expect(page.locator("#preview")).toContainText(
    "different oven temperatures",
  );
  await expect(page.locator("#preview")).toContainText("17:40");
  await page.getByLabel("Meal name", { exact: true }).fill("My dinner");
  await page.getByRole("button", { name: "Save meal", exact: true }).click();
  await page.reload();
  await expect(page.getByLabel("Meal name", { exact: true })).toHaveValue(
    "My dinner",
  );
  await page
    .getByRole("button", { name: "Start 45 min timer", exact: true })
    .click();
  await expect(page.locator("#timers")).toContainText("Roasted vegetables");
  await page.reload();
  await expect(page.locator("#timers .clock")).toContainText("remaining");
  expect(errors).toEqual([]);
});
test("backup replacement is previewed, cancel preserves data, corrupt bytes require confirmation", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Load example", exact: true }).click();
  const before = await page.evaluate((k) => localStorage.getItem(k), key);
  await page.locator("#import").setInputFiles({
    name: "empty.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        app: APP,
        version: 1,
        data: { meals: [], timers: [] },
      }),
    ),
  });
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByRole("button", { name: "Cancel import", exact: true })
    .click();
  expect(await page.evaluate((k) => localStorage.getItem(k), key)).toBe(before);
  await page.evaluate((k) => localStorage.setItem(k, "broken original"), key);
  await page.reload();
  await expect(page.locator("#recover")).toBeVisible();
  await page.locator("#import").setInputFiles({
    name: "good.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({ app: APP, version: 1, data: example() }),
    ),
  });
  await page
    .getByRole("button", { name: "Apply replacement", exact: true })
    .click();
  expect(await page.evaluate((k) => localStorage.getItem(k), key)).toBe(
    "broken original",
  );
  await page.locator("#replace-confirm").check();
  await page
    .getByRole("button", { name: "Apply replacement", exact: true })
    .click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.locator("#recover")).toBeHidden();
});
test("stale tab and rejected storage writes retain saved bytes; narrow view and print include schedule", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Load example", exact: true }).click();
  const second = await context.newPage();
  await second.goto("/");
  await page.getByLabel("Meal name", { exact: true }).fill("First tab");
  await page.getByRole("button", { name: "Save meal", exact: true }).click();
  await second.getByLabel("Meal name", { exact: true }).fill("Stale overwrite");
  await second.getByRole("button", { name: "Save meal", exact: true }).click();
  await expect(second.locator("#message")).toContainText(
    /another tab|Another tab/,
  );
  await second.close();
  const raw = await page.evaluate((k) => localStorage.getItem(k), key);
  await page.evaluate(
    () =>
      (Storage.prototype.setItem = function () {
        throw new DOMException("quota", "QuotaExceededError");
      }),
  );
  await page.getByLabel("Meal name", { exact: true }).fill("Quota draft");
  await page.getByRole("button", { name: "Save meal", exact: true }).click();
  await expect(page.locator("#message")).toContainText("rejected the save");
  expect(await page.evaluate((k) => localStorage.getItem(k), key)).toBe(raw);
  await page.reload();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
  await page.emulateMedia({ media: "print" });
  await expect(page.locator("#print-sheet")).toBeVisible();
  await expect(page.locator("#print-sheet")).toContainText(
    "Roasted vegetables",
  );
});
