import { test as base, expect } from "@playwright/test";

export const test = base.extend({
  page: async ({ page, browserName }, use) => {
    if (browserName !== "chromium") {
      await page.route(
        /^https:\/\/(api\.github\.com|raw\.githubusercontent\.com|api\.cfwidget\.com|almanax21\.com)\//,
        async (route) => {
          const response = await route.fetch();
          await route.fulfill({ response });
        },
      );
    }
    await use(page);
    await page.unrouteAll({ behavior: "ignoreErrors" });
  },
});
export { expect };
