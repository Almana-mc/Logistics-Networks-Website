import { test, expect } from "./browser";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
const require = createRequire(import.meta.url);

const localOrigin = (baseURL?: string) =>
  new URL(baseURL!).origin.replace("127.0.0.1", "localhost");

test("a local network becomes a short link that opens for 12 hours", async ({
  page,
  context,
  baseURL,
  browserName,
}) => {
  const origin = localOrigin(baseURL);
  const chromium = browserName === "chromium";
  if (chromium)
    await context.grantPermissions(["clipboard-read", "clipboard-write"], {
      origin,
    });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`${origin}/visualiser.html`);
  await page.getByLabel("Choose a .lnet or .txt file").setInputFiles({
    name: "shared-bees.lnet",
    mimeType: "text/plain",
    buffer: await readFile("library/bee-automation.lnet"),
  });
  await page.getByRole("button", { name: "Share link" }).click();
  const dialog = page.getByRole("dialog", { name: "Share this network" });
  await expect(dialog).toContainText("shared-bees.lnet");
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
  await dialog.getByRole("button", { name: "Create link" }).click();
  const link = page.getByRole("textbox", { name: "Share link" });
  await expect(link).toHaveValue(new RegExp(`^${origin}/s/[A-Za-z0-9_-]{11}$`));
  const url = await link.inputValue();
  if (chromium) {
    await page.getByRole("button", { name: "Copy", exact: true }).click();
    await expect(
      page.getByRole("status").filter({ hasText: "Copied" }),
    ).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(url);
  }
  await page.getByRole("button", { name: "Done" }).click();
  await expect(page.getByRole("button", { name: "Share link" })).toBeFocused();

  const recipient = await context.newPage();
  await recipient.emulateMedia({ reducedMotion: "reduce" });
  await recipient.goto(url);
  await expect(recipient).toHaveURL(
    /\/visualiser\.html\?share=[A-Za-z0-9_-]{11}$/,
  );
  await expect(recipient.getByRole("heading", { level: 1 })).toHaveText(
    "Bee Automation",
  );
  await expect(recipient.locator(".network-meta")).toContainText(
    "Shared link · from shared-bees.lnet · expires in 12 hours",
  );
  await expect(
    recipient.getByRole("link", { name: "Download .lnet" }),
  ).toBeVisible();
  await expect(
    recipient.getByRole("button", { name: "Copy link" }),
  ).toBeVisible();
  await expect(
    recipient.getByRole("button", { name: "Share link" }),
  ).toHaveCount(0);
});

test("an unknown share link explains that links expire", async ({
  page,
  baseURL,
}) => {
  await page.goto(`${localOrigin(baseURL)}/s/AAAAAAAAAAA`);
  await expect(page.getByRole("alert")).toContainText(
    "expired or never existed",
  );
  await expect(page.getByLabel("Choose a .lnet or .txt file")).toBeVisible();
});
