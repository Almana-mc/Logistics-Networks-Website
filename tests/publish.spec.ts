import { test, expect } from "./browser";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { mailTo, violations } from "./accounts";

test.skip(
  ({ browserName }) => browserName !== "chromium",
  "Account flows run in Chromium",
);

const localOrigin = (baseURL?: string) =>
  new URL(baseURL!).origin.replace("127.0.0.1", "localhost");

test("account holders publish, edit and delete a network", async ({
  page,
  baseURL,
}) => {
  const site = localOrigin(baseURL);
  const username = `p${Date.now().toString(36)}`;
  const email = `${username}@example.test`;
  const password = `tram ${randomUUID()}`;
  const name = `Hive line ${username}`;
  const headers = { Origin: site };
  await page.request.post(`${site}/api/signup`, {
    headers,
    data: { username, email, password },
  });
  const token = (await mailTo(email)).match(/#signup=(\S+)/)![1];
  const data = { token, password };
  await page.request.post(`${site}/api/signup/verify`, { headers, data });
  await page.request.post(`${site}/api/logout`, { headers, data: {} });

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`${site}/visualiser.html`);
  await page.getByLabel("Choose a .lnet file").setInputFiles({
    name: "bees.lnet",
    mimeType: "text/plain",
    buffer: await readFile("library/bee-automation.lnet"),
  });
  await page.getByRole("button", { name: "Publish" }).click();
  const dialog = page.getByRole("dialog", { name: "Sign in to publish" });
  await dialog.getByLabel("Username or email").fill(username);
  await dialog.getByLabel("Password").fill(password);
  await dialog.getByRole("button", { name: "Sign in" }).click();

  const form = page.getByRole("dialog", { name: "Publish to the library" });
  await expect(form.getByLabel("Name", { exact: true })).toHaveValue(
    "Bee Automation",
  );
  await expect(form.getByLabel("Name", { exact: true })).toBeFocused();
  expect(await violations(page)).toEqual([]);
  await form.getByLabel("Name", { exact: true }).fill(name);
  await form.getByLabel("Description").fill("Six hives feed one centrifuge.");
  await form.getByRole("button", { name: "Publish" }).click();
  const link = page.getByRole("textbox", { name: "Library link" });
  await expect(link).toHaveValue(
    new RegExp(`^${site}/visualiser\\.html\\?network=[A-Za-z0-9_-]{11}$`),
  );
  await page.getByRole("button", { name: "Done" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(name);
  await expect(page.getByText("Six hives feed one centrifuge.")).toBeVisible();
  await expect(page.getByText(`By ${username}`)).toBeVisible();
  await expect(page.getByRole("button", { name: "Publish" })).toHaveCount(0);

  await page.goto(`${site}/library.html`);
  await page.getByLabel("Find a network").fill(username);
  await expect(page.locator(".network-card")).toHaveCount(1);
  await expect(page.locator(".network-card")).toContainText("community");

  await page.goto(`${site}/account.html`);
  await page.getByRole("button", { name: `Edit ${name}` }).click();
  await page.getByLabel("Description").fill("Six hives, one honey line.");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(
    page.getByRole("button", { name: `Edit ${name}` }),
  ).toBeFocused();
  await expect(page.getByText("Six hives, one honey line.")).toBeVisible();
  expect(await violations(page)).toEqual([]);
  await page.getByRole("button", { name: `Delete ${name}` }).click();
  await page.getByRole("button", { name: "Delete network" }).click();
  await expect(page.getByText(`Deleted ${name}.`)).toBeFocused();
  await expect(page.getByText("Nothing published yet.")).toBeVisible();
});
