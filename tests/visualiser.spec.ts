import { test, expect } from "./browser";
import { readFile } from "node:fs/promises";

test("local import, node inspection, static graph, raw download and recovery", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("visualiser.html");
  const sent: string[] = [];
  page.on("request", (request) => {
    if (request.method() !== "GET") sent.push(request.url());
  });
  const bytes = await readFile("library/pilpohs-bee-setup.lnet");
  await page.getByLabel("Choose a .lnet or .txt file").setInputFiles({
    name: "my-local-export.lnet",
    mimeType: "text/plain",
    buffer: bytes,
  });
  await page.getByLabel("Inspect a node").selectOption("0");
  await expect(
    page.getByRole("complementary", { name: "Selected node details" }),
  ).toBeVisible();
  await page.locator(".node-channel summary").first().click();
  await expect(page.locator(".channel-settings").first()).toBeVisible();
  expect(
    await page.locator(".node-channel summary").allTextContents(),
  ).not.toContain("Channel 0");
  const canvas = page.locator("canvas");
  const first = await canvas.evaluate((node) =>
    (node as HTMLCanvasElement).toDataURL(),
  );
  await page.getByRole("button", { name: "Zoom in" }).click();
  expect(
    await canvas.evaluate((node) => (node as HTMLCanvasElement).toDataURL()),
  ).not.toBe(first);
  await page.getByRole("button", { name: "Reset view" }).click();
  expect(
    await canvas.evaluate((node) => (node as HTMLCanvasElement).toDataURL()),
  ).toBe(first);
  await page.screenshot({ fullPage: true });
  expect(
    await canvas.evaluate((node) => {
      const canvas = node as HTMLCanvasElement;
      return canvas
        .getContext("2d")!
        .getImageData(0, 0, canvas.width, canvas.height)
        .data.some((value, index) => index % 4 === 3 && value > 0);
    }),
  ).toBeTruthy();
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("link", { name: "Download .lnet" }).click();
  const download = await downloadEvent;
  expect(Buffer.compare(await readFile((await download.path())!), bytes)).toBe(
    0,
  );
  await page.getByRole("button", { name: "New file", exact: true }).click();
  await page.getByLabel("Choose a .lnet or .txt file").setInputFiles({
    name: "bad.lnet",
    mimeType: "text/plain",
    buffer: Buffer.from("invalid"),
  });
  await expect(page.getByRole("alert")).toContainText("header");
  await page.getByRole("button", { name: "Load example network" }).click();
  await expect(page.getByLabel("Inspect a node")).toBeVisible();
  expect(sent).toEqual([]);
});

test("visualiser keeps a 500-node layout below 200ms", async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== "chromium", "Uses the Chromium performance budget.");
  await page.goto("visualiser.html");
  const elapsed = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.style.cssText =
      "position:fixed;left:-10000px;top:0;width:1000px;height:600px";
    document.body.append(canvas);
    const graph = new window.NetworkGraph(canvas, {
      style: "wireframe",
      pulseSpeed: 0,
      breathing: false,
      nodePulse: false,
      interactive: false,
    });
    const nodes = Array.from({ length: 500 }, (_, index) => ({
      label: `Node ${index}`,
      dominantType: "ITEM",
      role: "node",
      baseR: 11,
    }));
    const edges = Array.from({ length: 499 }, (_, index) => ({
      from: index,
      to: index + 1,
      type: "ITEM",
      channel: 0,
    }));
    const started = performance.now();
    graph.setData({ nodes, edges });
    const duration = performance.now() - started;
    graph.destroy();
    canvas.remove();
    return duration;
  });
  expect(elapsed).toBeLessThan(200);
});
