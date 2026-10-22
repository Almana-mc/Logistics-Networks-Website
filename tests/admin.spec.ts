import { test, expect } from "./browser";
import type { APIRequestContext } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import { mailTo, violations } from "./accounts";

test.skip(
  ({ browserName }) => browserName !== "chromium",
  "Account flows run in Chromium",
);

const adminId = 1_000_000;
const localOrigin = (baseURL?: string) =>
  new URL(baseURL!).origin.replace("127.0.0.1", "localhost");

async function createAccount(
  request: APIRequestContext,
  site: string,
  username: string,
  email: string,
) {
  const password = `tram ${randomUUID()}`;
  const headers = { Origin: site };
  await request.post(`${site}/api/signup`, {
    headers,
    data: { username, email, password },
  });
  const token = (await mailTo(email)).match(/#signup=(\S+)/)![1];
  await request.post(`${site}/api/signup/verify`, {
    headers,
    data: { token, password },
  });
  return password;
}

function promote(username: string) {
  const db = new DatabaseSync(".data/app.db");
  db.exec("PRAGMA busy_timeout = 5000; PRAGMA foreign_keys = ON;");
  db.prepare("DELETE FROM users WHERE id = ?").run(adminId);
  db.prepare("DELETE FROM admin_log WHERE admin_id = ?").run(adminId);
  db.prepare("UPDATE users SET id = ? WHERE username = ?").run(
    adminId,
    username,
  );
  db.close();
}

test("the admin renames, suspends and blocks users and removes networks", async ({
  page,
  baseURL,
}) => {
  const site = localOrigin(baseURL);
  const headers = { Origin: site };
  const stamp = Date.now().toString(36);
  const member = `m${stamp}`;
  const memberEmail = `${member}@${member}.test`;
  const network = `Hive line ${stamp}`;
  await createAccount(page.request, site, member, memberEmail);
  await page.request.post(`${site}/api/networks`, {
    headers,
    data: {
      name: network,
      description: "Six hives feed one centrifuge.",
      lnet: await readFile("library/bee-automation.lnet", "utf8"),
      types: ["ITEM"],
    },
  });
  await page.request.post(`${site}/api/logout`, { headers, data: {} });
  const boss = `a${stamp}`;
  const password = await createAccount(
    page.request,
    site,
    boss,
    `${boss}@example.test`,
  );
  await page.request.post(`${site}/api/logout`, { headers, data: {} });
  promote(boss);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`${site}/sign-in.html`);
  const signIn = page.getByRole("region", {
    name: "Sign in with your password",
  });
  await signIn.getByLabel("Username or email").fill(boss);
  await signIn.getByLabel("Password").fill(password);
  await signIn.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/account\.html/);
  await page.getByRole("link", { name: "Open admin tools" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Admin tools",
  );
  expect(await violations(page)).toEqual([]);

  await page.getByLabel("Username or email").fill(member);
  await page.getByRole("button", { name: "Search" }).click();
  await page.getByRole("button", { name: new RegExp(member) }).click();
  await page.getByLabel("Username", { exact: true }).fill(`${member}x`);
  await page.getByRole("button", { name: "Save user" }).click();
  await expect(page.getByText("Saved. The user was emailed.")).toBeVisible();
  expect(await mailTo(memberEmail)).toContain(`"${member}x"`);
  await page.getByRole("button", { name: "Suspend", exact: true }).click();
  const lift = page.getByRole("button", { name: "Lift suspension" });
  await expect(lift).toBeVisible();
  expect(await mailTo(memberEmail)).toContain("suspended");
  expect(await violations(page)).toEqual([]);
  await lift.click();
  await expect(
    page.getByRole("button", { name: "Suspend", exact: true }),
  ).toBeVisible();

  const blocked = page.locator("strong", { hasText: `@${member}.test` });
  await page.getByLabel("Email or @domain").fill(`@${member}.test`);
  await page.getByRole("button", { name: "Block", exact: true }).click();
  await expect(blocked).toBeVisible();
  await page.getByRole("button", { name: `Unblock @${member}.test` }).click();
  await expect(blocked).toHaveCount(0);

  await page.goto(`${site}/library.html`);
  await page.getByLabel("Find a network").fill(network);
  await page.getByRole("button", { name: `Delete ${network}` }).click();
  await page.getByRole("button", { name: "Delete network" }).click();
  await expect(page.getByText(`Deleted ${network}.`)).toBeFocused();

  await page.goto(`${site}/admin.html`);
  const log = page.getByRole("region", { name: "Audit log" });
  for (const action of [
    "user.rename",
    "user.suspend",
    "user.lift",
    "block.add",
    "block.remove",
    "network.delete",
  ])
    await expect(log.getByText(`${boss} · ${action}`)).toBeVisible();
});
