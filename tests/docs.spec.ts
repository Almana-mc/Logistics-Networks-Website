import { test, expect } from "./browser";

test("guide loading keeps the article and footer stable", async ({ page }) => {
  let finishLoading: () => void;
  const pending = new Promise<void>((resolve) => {
    finishLoading = resolve;
  });
  await page.route("**/guide/index.md", async (route) => {
    await pending;
    await route.fallback();
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("docs.html");
  await expect(page.getByRole("status")).toContainText("Loading the guide");
  await page.evaluate(() => document.fonts.ready);
  const before = (await page.locator(".doc-article").boundingBox())!;
  expect(
    (await page.locator("footer").boundingBox())!.y,
  ).toBeGreaterThanOrEqual(844);
  finishLoading!();
  await expect(page.locator(".doc-context")).toBeVisible({ timeout: 30000 });
  const after = (await page.locator(".doc-article").boundingBox())!;
  expect(Math.abs(after.y - before.y)).toBeLessThan(1);
});

test("documentation renders the initial guide while metadata is pending", async ({
  page,
}) => {
  let releaseMetadata!: () => void;
  const metadataPending = new Promise<void>((resolve) => {
    releaseMetadata = resolve;
  });
  await page.route("https://api.github.com/**", async (route) => {
    await metadataPending;
    await route.abort();
  });
  await page.route("https://raw.githubusercontent.com/**", (route) =>
    route.fulfill({
      contentType: "text/markdown",
      body: "# Local guide\n\nReady before metadata.",
    }),
  );
  try {
    await page.goto("docs.html");
    await expect(
      page.getByRole("heading", { name: "Local guide" }),
    ).toBeVisible();
  } finally {
    releaseMetadata();
  }
});

test("documentation chapter, relative link, version and mobile access", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("docs.html");
  await expect(page.locator(".doc-context")).toBeVisible({ timeout: 30000 });
  await page.getByRole("button", { name: "Contents" }).click();
  await page
    .getByRole("navigation", { name: "Documentation chapters" })
    .getByRole("link", { name: "Channel Settings", exact: true })
    .click();
  await expect(page).toHaveURL(/#nodes\/channel-settings$/);
  await expect(page.locator(".doc-context")).toBeVisible();
  await page.getByRole("button", { name: "Contents" }).click();
  await page.getByLabel("Minecraft version").selectOption("1.21.1");
  await expect(
    page.getByRole("link", { name: "View this page on GitHub" }),
  ).toHaveAttribute("href", /\/blob\/1\.21\.1\//, { timeout: 30000 });
  await page.reload();
  await expect(page.getByLabel("Minecraft version")).toHaveValue("1.21.1");
  await page
    .getByRole("navigation", { name: "Primary", exact: true })
    .getByRole("link", { name: "Visualiser", exact: true })
    .click();
  await expect(page.getByLabel("Choose a .lnet file")).toBeVisible();
});

test("blocked storage and unavailable guide retain usable chrome", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new Error("Storage disabled");
      },
    }),
  );
  await page.route("https://raw.githubusercontent.com/**", (route) =>
    route.fulfill({ status: 503, body: "unavailable" }),
  );
  await page.goto("docs.html");
  await expect(
    page.getByRole("heading", { name: "Could not load the guide" }),
  ).toBeVisible({ timeout: 30000 });
  await expect(
    page.getByRole("button", { name: "Retry loading" }),
  ).toBeVisible();
  await expect(page.getByLabel("Minecraft version")).toBeEnabled();
  await expect(
    page.getByRole("link", { name: "View guide source" }),
  ).toHaveAttribute("href", /github.com/);
});
