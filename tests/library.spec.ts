import { test, expect } from "./browser";
import { readFile } from "node:fs/promises";

test("library search, filters, reset and handoff", async ({ page }) => {
  await page.goto("library.html");
  await expect(page.locator(".network-row")).toHaveCount(3);
  await page.getByLabel("Find a network").fill("pilpoh");
  await expect(page.locator(".network-row")).toHaveCount(1);
  await page.getByRole("button", { name: "Chemicals", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "No matching networks" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).first().click();
  await expect(page.locator(".network-row")).toHaveCount(3);
  await page.getByLabel("Sort by").selectOption("name");
  await expect(page.locator(".network-row h2").first()).toHaveText(
    "Bee Automation",
  );
  await page
    .locator(".network-row")
    .first()
    .getByRole("link", { name: "Open network" })
    .click();
  await expect(page.getByLabel("Inspect a node")).toBeVisible();
  await expect(page.locator(".network-stats")).toContainText("6 nodes");
});

test("library failures and accessible pagination", async ({ page }) => {
  await page.route("**/library/index.json", (route) =>
    route.fulfill({ status: 500, body: "unavailable" }),
  );
  await page.goto("library.html");
  await expect(page.getByRole("alert")).toContainText("Could not load");
  const source = JSON.parse(await readFile("library/index.json", "utf8"))[0];
  const entries = Array.from({ length: 26 }, (_, index) => ({
    ...source,
    file: `network-${index}.lnet`,
    name: `Network ${index}`,
  }));
  await page.unroute("**/library/index.json");
  await page.route("**/library/index.json", (route) =>
    route.fulfill({ json: entries }),
  );
  await page.getByRole("button", { name: "Retry loading" }).click();
  await expect(page.locator(".network-row")).toHaveCount(24);
  await page.getByRole("button", { name: "Load more networks" }).click();
  await expect(page.locator(".network-row")).toHaveCount(26);
});
