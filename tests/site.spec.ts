import { test, expect } from "./browser";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
const require = createRequire(import.meta.url);

for (const route of [
  "index.html",
  "library.html",
  "docs.html",
  "visualiser.html",
]) {
  test(`${route}: responsive landmarks, logo, navigation and accessibility`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(route);
    if (route === "docs.html")
      await expect(page.locator(".doc-context")).toBeVisible({
        timeout: 30000,
      });
    if (route === "library.html")
      await expect(page.locator(".network-row")).toHaveCount(3);
    for (const width of [320, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await expect(page.locator("main")).toHaveCount(1);
      await expect(page.locator("h1")).toHaveCount(1);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBeTruthy();
      const collapsed = width <= 1024 && route !== "docs.html";
      if (collapsed)
        await page.getByRole("button", { name: "Menu", exact: true }).click();
      for (const name of ["Home", "Library", "Docs", "Visualiser"])
        await expect(
          page
            .getByRole("navigation", { name: "Primary", exact: true })
            .getByRole("link", { name, exact: true }),
        ).toBeVisible();
      if (collapsed) {
        await page.keyboard.press("Escape");
        await expect(
          page.getByRole("button", { name: "Menu", exact: true }),
        ).toBeFocused();
      }
    }
    const favicon = await page.locator('link[rel="icon"]').getAttribute("href");
    const image = await page.request.get(favicon!);
    expect(image.ok()).toBeTruthy();
    expect(
      Buffer.compare(
        await image.body(),
        await readFile("assets/logistic-icon.png"),
      ),
    ).toBe(0);
    for (const image of await page.locator("img").all()) {
      await image.scrollIntoViewIfNeeded();
      await expect
        .poll(() =>
          image.evaluate((node) => (node as HTMLImageElement).naturalWidth),
        )
        .toBeGreaterThan(0);
    }
    await expect
      .poll(() =>
        page
          .locator("header img")
          .evaluate((node) => (node as HTMLImageElement).naturalWidth),
      )
      .toBe(route === "docs.html" ? 72 : 104);
    await page.evaluate(
      await readFile(require.resolve("axe-core/axe.min.js"), "utf8"),
    );
    const violations = await page.evaluate(
      async () =>
        (
          await window.axe.run(document, {
            runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] },
          })
        ).violations,
    );
    expect(violations.map((violation: { id: string }) => violation.id)).toEqual(
      [],
    );
    expect(errors).toEqual([]);
  });
}

test("homepage actions and download destinations", async ({ page }) => {
  await page.goto("index.html");
  await page
    .locator(".hero-copy")
    .getByRole("link", { name: "Get Logistics Network" })
    .click();
  await expect(page).toHaveURL(/#download$/);
  await expect(
    page.getByRole("link", { name: "Download on CurseForge" }),
  ).toHaveAttribute(
    "href",
    "https://www.curseforge.com/minecraft/mc-mods/logistics-network",
  );
  await page
    .locator(".hero-copy")
    .getByRole("link", { name: "Open visualiser" })
    .click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Network visualiser",
  );
});

test("homepage hero artwork has no opaque background", async ({ page }) => {
  await page.goto("index.html");
  const transparent = await page.locator(".hero-art img").evaluate((node) => {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    canvas.getContext("2d")!.drawImage(node as HTMLImageElement, 0, 0);
    return canvas.getContext("2d")!.getImageData(0, 0, 1, 1).data[3] === 0;
  });
  expect(transparent).toBeTruthy();
});
