import type { Page } from "@playwright/test";
import { readFile, readdir, rm } from "node:fs/promises";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

export async function mailTo(email: string) {
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

export async function violations(page: Page) {
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
