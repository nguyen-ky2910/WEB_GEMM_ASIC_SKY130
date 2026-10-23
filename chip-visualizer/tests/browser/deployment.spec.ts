import { test, expect } from "@playwright/test";
import { pageNames } from "../../src/app/navigation";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

test.skip(
  process.env.PLAYWRIGHT_COMBINED_SITE !== "1",
  "Requires the combined production artifact",
);

test("every file in the combined artifact is served with identical bytes", async ({
  request,
  baseURL,
}) => {
  const root = path.resolve("../dist");
  const url = new URL("../", baseURL);
  const walk = (directory: string): string[] =>
    fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
      const file = path.join(directory, entry.name);
      return entry.isDirectory() ? walk(file) : [file];
    });
  const files = walk(root);
  expect(files.length).toBeGreaterThan(100);
  for (const file of files) {
    const relative = path
      .relative(root, file)
      .split(path.sep)
      .map(encodeURIComponent)
      .join("/");
    const response = await request.get(new URL(relative, url).href);
    expect(response.status(), relative).toBe(200);
    const sha = (data: Buffer) =>
      crypto.createHash("sha256").update(data).digest("hex");
    expect(sha(await response.body()), relative).toBe(
      sha(fs.readFileSync(file)),
    );
  }
});

test("all 15 direct hash links survive reload with no missing assets", async ({
  page,
  baseURL,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("response", (response) => {
    if (response.status() >= 400)
      errors.push(`${response.status()} ${response.url()}`);
  });
  page.on("requestfailed", (request) => {
    if (request.failure()?.errorText !== "net::ERR_ABORTED")
      errors.push(request.url());
  });
  for (const name of pageNames) {
    await page.goto(`${baseURL}#/${name}`);
    await expect(page.getByTestId(`nav-${name}`)).toHaveClass("active");
    expect((await page.reload())?.status()).toBe(200);
    await expect(page.getByTestId(`nav-${name}`)).toHaveClass("active");
    await expect(page.locator(".breadcrumb strong")).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`#/${name}$`));
  }
  expect(errors).toEqual([]);
});

test("browser back and forward restore the selected page", async ({ page }) => {
  await page.goto("./#/explorer");
  await page.getByTestId("nav-gemm").click();
  await expect(page).toHaveURL(/#\/gemm$/);
  await page.getByTestId("nav-axi").click();
  await expect(page).toHaveURL(/#\/axi$/);
  await page.goBack();
  await expect(page.getByTestId("nav-gemm")).toHaveClass("active");
  await page.goForward();
  await expect(page.getByTestId("nav-axi")).toHaveClass("active");
});

test("legacy homepage, navigation, dataflow animation and original assets still work", async ({
  page,
  baseURL,
  request,
}) => {
  const root = new URL("../", baseURL).href;
  expect((await page.goto(root))?.status()).toBe(200);
  await expect(page).toHaveTitle(/Hierarchical ASIC Research/);
  await expect(page.locator("h1")).toContainText("A thousand PEs.");
  await page.getByRole("link", { name: "Explore architecture" }).click();
  await expect(page).toHaveURL(/#architecture$/);
  await page.locator("#array-play").click();
  await expect(page.locator("#array-play")).toHaveText("Pause dataflow");
  await expect(page.locator("#array-step")).not.toHaveText(
    "Illustration step 00",
  );
  await page.locator("#array-play").click();
  for (const asset of [
    "src/main.js",
    "src/data.js",
    "src/style.css",
    "images/pe-3d.png",
    "models/processing-element.html",
  ]) {
    const response = await request.get(new URL(asset, root).href);
    expect(response.status(), asset).toBe(200);
  }
  await page.screenshot({
    path: "test-results/legacy-production.png",
    fullPage: true,
  });
});
