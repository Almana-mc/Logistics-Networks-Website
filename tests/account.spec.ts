import { test, expect } from "./browser";
import type { Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { readFile, readdir, rm } from "node:fs/promises";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const site = "http://localhost:8794";

test.skip(
  ({ browserName }) => browserName !== "chromium",
  "Account flows run in Chromium",
);

async function mailTo(email: string) {
  for (let attempt = 0; attempt < 40; attempt++) {
    const files = await readdir(".data/outbox").catch(() => [] as string[]);
    for (const file of files.filter((name) => name.endsWith(".json"))) {
      const mail = JSON.parse(await readFile(`.data/outbox/${file}`, "utf8"));
      if (mail.to !== email) continue;
      await rm(`.data/outbox/${file}`);
      return mail.text as string;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`No email for ${email}`);
}

async function violations(page: Page) {
  await page.evaluate(
    await readFile(require.resolve("axe-core/axe.min.js"), "utf8"),
  );
  return page.evaluate(
    async () =>
      (
        await window.axe.run(document, {
          runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] },
        })
      ).violations,
  );
}

test("create an account with a password, sign out and sign back in", async ({
  page,
}) => {
  const username = `u${Date.now().toString(36)}`;
  const email = `${username}@example.test`;
  const password = `tram ${randomUUID()}`;
  await page.goto(`${site}/sign-in.html`);
  await page.getByRole("button", { name: "Create an account" }).click();
  await page.getByLabel("Username", { exact: true }).fill(username);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  expect(await violations(page)).toEqual([]);
  expect(await violations(page)).toEqual([]);
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Check your inbox");
  const link = (await mailTo(email)).match(/https?:\/\/\S+/)![0];
  await page.goto(`${site}/library.html`);
  await page.goto(link);
  await page.getByLabel("Your password").fill(password);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(username);
  expect(await violations(page)).toEqual([]);
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/sign-in\.html$/);
  await page.getByLabel("Username or email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(username);
});
