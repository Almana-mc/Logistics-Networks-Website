import { test, expect } from "./browser";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { mailTo, violations } from "./accounts";

const site = "http://localhost:8794";

test.skip(
  ({ browserName }) => browserName !== "chromium",
  "Account flows run in Chromium",
);

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

test("signed-in users share links that open without an account", async ({
  page,
  browser,
}) => {
  const username = `s${Date.now().toString(36)}`;
  const email = `${username}@example.test`;
  const password = `tram ${randomUUID()}`;
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`${site}/sign-in.html`);
  await page.getByRole("button", { name: "Create an account" }).click();
  await page.getByLabel("Username", { exact: true }).fill(username);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  const confirm = (await mailTo(email)).match(/https?:\/\/\S+/)![0];
  await page.goto(`${site}/visualiser.html`);
  await page.goto(confirm);
  await page.getByLabel("Your password").fill(password);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(username);

  await page.goto(`${site}/visualiser.html`);
  await expect(page.getByRole("link", { name: username })).toBeVisible();
  await page.getByLabel("Choose a .lnet file").setInputFiles({
    name: "signed-in.lnet",
    mimeType: "text/plain",
    buffer: await readFile("library/bee-automation.lnet"),
  });
  await page.getByRole("button", { name: "Share link" }).click();
  await page.getByRole("button", { name: "Create link" }).click();
  const link = page.getByRole("textbox", { name: "Share link" });
  await expect(link).toHaveValue(new RegExp(`^${site}/s/[A-Za-z0-9_-]{11}$`));
  const url = await link.inputValue();

  const guest = await browser.newContext({ reducedMotion: "reduce" });
  const visitor = await guest.newPage();
  for (const viewer of [page, visitor]) {
    await viewer.goto(url);
    await expect(
      viewer.getByRole("button", { name: "Copy link" }),
    ).toBeVisible();
  }
  await expect(visitor.getByRole("link", { name: "Sign in" })).toBeVisible();
  await guest.close();
});
