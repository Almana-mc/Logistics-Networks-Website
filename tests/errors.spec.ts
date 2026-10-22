import { test, expect } from "./browser";

test("missing pages get the styled 404 page at any depth", async ({ page }) => {
  const response = await page.goto("a/b/no-such-page");
  expect(response!.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "This page doesn't exist",
  );
  await expect(page.locator("[data-path]")).toHaveText("/a/b/no-such-page");
  await expect(page.locator("body")).toHaveCSS(
    "background-color",
    "rgb(21, 23, 29)",
  );
  await page
    .locator(".error-pages")
    .getByRole("link", { name: /Library/ })
    .click();
  await expect(page).toHaveURL(/\/library\.html$/);
});

test("malformed addresses get the 400 page", async ({ page }) => {
  const response = await page.request.get("%E0%A4%A");
  expect(response.status()).toBe(400);
  expect(await response.text()).toContain("This request couldn&#x27;t be read");
});

test("server error pages offer a retry of the same address", async ({
  page,
}) => {
  for (const code of ["403", "410", "429", "500", "502", "504", "error"])
    expect((await page.request.get(`errors/${code}.html`)).ok()).toBeTruthy();
  await page.goto("errors/503.html");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "The site is temporarily unavailable",
  );
  await expect(page.getByRole("link", { name: "Try again" })).toHaveAttribute(
    "href",
    "",
  );
  await expect(page.locator(".error-pages")).toHaveCount(0);
});
