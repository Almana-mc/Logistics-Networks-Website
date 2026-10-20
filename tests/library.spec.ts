import { test, expect } from "./browser";
import { readFile } from "node:fs/promises";

test("library search, filters, reset and handoff", async ({ page }) => {
  await page.goto("library.html");
  await expect(page.locator(".network-card")).toHaveCount(3);
  await page.getByLabel("Find a network").fill("pilpoh");
  await expect(page.locator(".network-card")).toHaveCount(1);
  await page.getByRole("button", { name: "Chemicals", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "No matching networks" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).first().click();
  await expect(page.locator(".network-card")).toHaveCount(3);
  await page.getByLabel("Sort by").selectOption("name");
  await expect(page.locator(".network-card h2").first()).toHaveText(
    "Bee Automation",
  );
  await page
    .locator(".network-card")
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
  const pager = page.getByRole("navigation", { name: "Library pages" });
  await expect(page.locator(".network-card")).toHaveCount(20);
  await expect(
    pager.getByRole("button", { name: "Previous page" }),
  ).toBeDisabled();
  await pager.getByRole("button", { name: "Next page" }).click();
  await expect(page.locator(".network-card")).toHaveCount(6);
  await expect(pager.getByRole("button", { name: "Page 2" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(page.getByRole("status")).toContainText("page 2 of 2");
  await page.getByLabel("Find a network").fill("network");
  await expect(page.locator(".network-card")).toHaveCount(20);
});
