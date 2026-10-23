import { test, expect } from "@playwright/test";
test("3D canvas, selection, camera, panels, bilingual state and paused animation", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("./");
  await expect(
    page.getByText("Silicon, from a different perspective."),
  ).toBeVisible();
  await expect(page.locator("canvas")).toBeVisible();
  await page.waitForTimeout(1600);
  const webgl = await page.locator("canvas").evaluate((canvas) => {
    const gl = (canvas as HTMLCanvasElement).getContext("webgl2");
    return gl
      ? { width: gl.drawingBufferWidth, height: gl.drawingBufferHeight }
      : null;
  });
  expect(webgl?.width).toBeGreaterThan(500);
  await page.screenshot({
    path: "test-results/explorer-desktop.png",
    fullPage: true,
  });
  await page.getByRole("switch", { name: "Auto rotate", exact: true }).check();
  const labelBefore = await page
    .locator(".projected-labels .chip-label")
    .first()
    .getAttribute("style");
  await page.waitForTimeout(400);
  expect(
    await page
      .locator(".projected-labels .chip-label")
      .first()
      .getAttribute("style"),
  ).not.toBe(labelBefore);
  await page
    .getByRole("switch", { name: "Auto rotate", exact: true })
    .uncheck();
  await page.getByTitle("Top", { exact: true }).first().click();
  await page.waitForTimeout(900);
  const labelBox = await page
    .locator(".projected-labels")
    .getByText("PE ROW 00", { exact: true })
    .boundingBox();
  expect(labelBox).not.toBeNull();
  await page.mouse.click(
    labelBox!.x + labelBox!.width / 2,
    labelBox!.y + labelBox!.height / 2,
  );
  await expect(page.locator(".inspector-data")).toContainText("g_pe_row[0]");
  await page
    .locator(".panel-tabs")
    .getByText("MODULE INSPECTOR", { exact: true })
    .click();
  await page.getByPlaceholder("Search module / instance…").fill("PE ROW 03");
  await page.locator(".module-list button").first().click();
  await expect(page.locator(".inspector-data")).toContainText(
    "3517.62 × 133.28",
  );
  await page.getByTitle("Toggle controls").click();
  await page.getByTitle("Toggle controls").click();
  await expect(page.getByPlaceholder("Search module / instance…")).toHaveValue(
    "PE ROW 03",
  );
  await page.getByLabel("Switch language").click();
  await expect(page.getByTestId("nav-gemm")).toContainText("Mô phỏng GEMM");
  await expect(page.getByPlaceholder("Tìm module / instance…")).toHaveValue(
    "PE ROW 03",
  );
  await page.getByLabel("Đổi ngôn ngữ").click();
  await page.getByTitle("Switch theme").click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.getByTitle("Switch theme").click();
  await page
    .locator(".animation-bar")
    .getByTitle("Play", { exact: true })
    .click();
  await page.waitForTimeout(650);
  await page
    .locator(".animation-bar")
    .getByTitle("Pause", { exact: true })
    .click();
  const progress = await page.getByTestId("animation-progress").inputValue();
  expect(Number(progress)).toBeGreaterThan(0);
  await page.waitForTimeout(350);
  await expect(page.getByTestId("animation-progress")).toHaveValue(progress);
  await page.getByTitle("Focus mode").click();
  await expect(page.locator(".sidebar")).toHaveCount(0);
  await expect(page.locator("canvas")).toBeVisible();
  await page.getByTitle("Exit focus mode").click();
  await page
    .locator(".animation-bar")
    .getByTitle("Stop", { exact: true })
    .click();
  await expect(page.getByTestId("animation-progress")).toHaveValue("0");
  expect(errors).toEqual([]);
});
test("GEMM editable inputs, reference result and v1 errata", async ({
  page,
}) => {
  await page.goto("./");
  await page.getByTestId("nav-gemm").click();
  await expect(
    page.getByText("Watch a matrix become a computation."),
  ).toBeVisible();
  await page.getByRole("slider", { name: "Progress", exact: true }).focus();
  await page.keyboard.press("End");
  await expect(
    page.getByText("MATCH · software reference", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Job M", { exact: true }).fill("1");
  await expect(
    page.getByText(
      "E2: M must be at least 2; M=1 yields wrong data / extra beats.",
      { exact: false },
    ),
  ).toBeVisible();
  await page.getByLabel("Feature matrix A 0,0", { exact: true }).fill("-128");
  await expect(
    page.getByRole("slider", { name: "Progress", exact: true }),
  ).toHaveValue("0");
  await page.screenshot({
    path: "test-results/gemm-desktop.png",
    fullPage: true,
  });
});
test("AXI manual backpressure holds payload, accepted beats advance and register ID read works", async ({
  page,
}) => {
  await page.goto("./");
  await page.getByTestId("nav-axi").click();
  await expect(page.getByText("Every beat. Every handshake.")).toBeVisible();
  await page.getByLabel("Backpressure", { exact: true }).selectOption("manual");
  await page
    .getByRole("switch", { name: "Downstream ready", exact: true })
    .uncheck();
  await page.getByRole("button", { name: "Step", exact: true }).click();
  const payload = await page.locator(".payload").innerText();
  await page.getByRole("button", { name: "Step", exact: true }).click();
  expect(await page.locator(".payload").innerText()).toBe(payload);
  await expect(
    page.getByText("Holding data stable", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("switch", { name: "Downstream ready", exact: true })
    .check();
  await page.getByRole("button", { name: "Step", exact: true }).click();
  await expect(page.getByText("Beat accepted", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "0x20", exact: true }).click();
  await page
    .getByRole("button", { name: "Read register", exact: true })
    .click();
  await page.getByRole("button", { name: "Step", exact: true }).click();
  await page.getByRole("button", { name: "Step", exact: true }).click();
  await expect(
    page.getByText("R 0x20 → 0x47454d4d · OKAY", { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/axi-desktop.png",
    fullPage: true,
  });
});
test("every navigation destination renders, source replay and responsive layout", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => {
    errors.push(e.message);
    console.log("PAGE ERROR:", e.stack);
  });
  await page.goto("./");
  for (const id of [
    "overview",
    "architecture",
    "flow",
    "eco",
    "waveform",
    "timing",
    "power",
    "area",
    "integrity",
    "verification",
    "comparison",
    "sources",
  ]) {
    await page.getByTestId(`nav-${id}`).click();
    await expect(page.locator(".breadcrumb strong")).toBeVisible();
    await page.waitForTimeout(150);
    expect(
      await page
        .locator("body")
        .evaluate((el) => el.scrollWidth <= window.innerWidth),
    ).toBe(true);
  }
  await page.getByTestId("nav-flow").click();
  await page.locator(".stage-rail button").nth(4).click();
  await expect(page.locator(".flow-overlay")).toContainText(
    "Clock Tree Synthesis",
  );
  await page.getByTestId("nav-power").click();
  await page
    .getByLabel("IP v1 job validator", { exact: true })
    .selectOption("8x32x544");
  await expect(
    page.locator(".stat-value").filter({ hasText: "751.03" }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/power-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.getByTestId("nav-explorer").click();
  await page.getByTitle("Toggle controls").click();
  await expect(page.locator("canvas")).toBeVisible();
  await page.screenshot({ path: "test-results/explorer-laptop.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  if (await page.locator(".sidebar").isVisible())
    await page.locator(".mobile-nav-close").click();
  await expect(
    page.locator("body").evaluate((el) => el.scrollWidth <= window.innerWidth),
  ).resolves.toBe(true);
  await page.screenshot({ path: "test-results/explorer-mobile.png" });
  expect(errors).toEqual([]);
});

test("normalized artifact imports preserve UI settings and reject invalid data", async ({
  page,
}) => {
  await page.goto("./");
  await page.getByTitle("Settings", { exact: true }).click();
  const geometry = {
    die: [8000, 10000],
    origin: [0, 0],
    kind: "REAL DATA",
    source: "Browser test fixture · not research evidence",
    unresolvedMasters: [],
    macros: [
      {
        id: "fixture.row",
        name: "IMPORTED ROW",
        type: "row",
        master: "ProcessingElementRow",
        x: 1000,
        y: 2000,
        w: 3000,
        h: 500,
        orientation: "N",
        source: "Synthetic import test only",
        rtl: null,
      },
    ],
  };
  await page
    .locator("input[type=file]")
    .nth(0)
    .setInputFiles({
      name: "layout.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(geometry)),
    });
  await expect(
    page.getByText("Extracted Physical Layout", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByLabel("Switch language").click();
  await expect(
    page.getByText("Layout vật lý được trích xuất", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Đổi ngôn ngữ").click();
  await page.getByTitle("Settings", { exact: true }).click();
  const wave = {
    signals: [
      {
        name: "test.clock",
        width: 1,
        events: [
          [0, "0"],
          [10, "1"],
          [20, "0"],
        ],
      },
      {
        name: "test.data",
        width: 8,
        events: [
          [0, "00000001"],
          [20, "11111111"],
        ],
      },
    ],
    end: 20,
    timescale: "1 ns",
    source: "Synthetic import test only",
    kind: "DEMO",
    truncated: false,
  };
  await page
    .locator("input[type=file]")
    .nth(1)
    .setInputFiles({
      name: "waveform.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(wave)),
    });
  await expect(
    page.getByText("Signals, with their evidence intact.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.locator(".signal-picker").getByText("test.clock", { exact: true }),
  ).toBeVisible();
  await page.getByTitle("Settings", { exact: true }).click();
  await page
    .locator("input[type=file]")
    .nth(0)
    .setInputFiles({
      name: "bad.json",
      mimeType: "application/json",
      buffer: Buffer.from('{"die":[-1,0]}'),
    });
  await expect(page.locator(".toast")).toContainText(
    "Invalid or unsupported dataset",
  );
});
