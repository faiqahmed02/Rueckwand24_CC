import { test, expect } from "@playwright/test";
test("desktop and mobile configuration flow", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await expect(page.getByRole("img")).toBeVisible();
  await expect(page.getByText("Motiv wird geladen …")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Rückwand 1 entfernen" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Rückwand hinzufügen" }).click();
  await page.getByLabel("Höhe", { exact: true }).nth(1).fill("80");
  await page.getByLabel("Höhe", { exact: true }).nth(1).blur();
  await page.waitForTimeout(200);
  await page.screenshot({ path: "screenshots/desktop.png", fullPage: true });
  const width = page.getByLabel("Breite", { exact: true }).first();
  await width.fill("125,5");
  await width.press("Tab");
  await expect(width).toHaveValue("125,5");
  await width.fill("999");
  await expect(width).toHaveAttribute("aria-invalid", "true");
  await width.blur();
  await expect(width).toHaveValue("125,5");
  await page.reload();
  await expect(page.getByLabel("Breite", { exact: true }).first()).toHaveValue(
    "125,5",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(200);
  await page.screenshot({ path: "screenshots/mobile.png", fullPage: true });
  for (let i = 2; i < 10; i++)
    await page.getByRole("button", { name: "Rückwand hinzufügen" }).click();
  for (const field of await page.getByLabel("Breite", { exact: true }).all())
    await field.fill("300");
  await expect(
    page.getByRole("button", { name: "Rückwand hinzufügen" }),
  ).toBeDisabled();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.waitForTimeout(200);
  await page.screenshot({
    path: "screenshots/mobile-ten-plates.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Rückwand 2 entfernen" }).click();
  await expect(page.getByLabel("Breite", { exact: true })).toHaveCount(9);
  expect(errors).toEqual([]);
});
test("image failure leaves controls usable", async ({ page }) => {
  await page.route("**/motif.jpg", (route) => route.abort());
  await page.goto("/");
  await expect(
    page.getByRole("status").filter({ hasText: "Das Motiv" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Rückwand hinzufügen" }).click();
  await expect(page.getByLabel("Breite", { exact: true })).toHaveCount(2);
});
test("asymmetric canvas motif mirrors continuously across plate boundaries", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => {
    const c = document.createElement("canvas");
    c.width = 300;
    c.height = 128;
    const x = c.getContext("2d")!;
    x.fillStyle = "red";
    x.fillRect(0, 0, 150, 128);
    x.fillStyle = "blue";
    x.fillRect(150, 0, 150, 128);
    localStorage.setItem("test-motif", c.toDataURL());
  });
  const data = await page.evaluate(() => localStorage.getItem("test-motif")!);
  await page.route("**/motif.jpg", (r) =>
    r.fulfill({
      contentType: "image/png",
      body: Buffer.from(data.split(",")[1], "base64"),
    }),
  );
  await page.reload();
  await page.getByRole("button", { name: "Rückwand hinzufügen" }).click();
  await page.getByLabel("Breite", { exact: true }).first().fill("300");
  await page.getByLabel("Breite", { exact: true }).nth(1).fill("300");
  await page.waitForTimeout(100);
  const colors = await page
    .locator("canvas")
    .evaluate((c: HTMLCanvasElement) => {
      const x = c.getContext("2d")!;
      return [0.1, 0.4, 0.6, 0.9].map((f) =>
        Array.from(
          x.getImageData(
            Math.floor(c.width * f),
            Math.floor(c.height / 2),
            1,
            1,
          ).data,
        ).slice(0, 3),
      );
    });
  expect(colors).toEqual([
    [255, 0, 0],
    [0, 0, 255],
    [0, 0, 255],
    [255, 0, 0],
  ]);
});

test("crossing plates preserve pixels at 300, 600 and 900 cm", async ({
  page,
}) => {
  await page.goto("/");
  const motif = await page.evaluate(() => {
    const c = document.createElement("canvas");
    c.width = 300;
    c.height = 128;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "red";
    ctx.fillRect(0, 0, 150, 128);
    ctx.fillStyle = "blue";
    ctx.fillRect(150, 0, 150, 128);
    return c.toDataURL().split(",")[1];
  });
  await page.route("**/motif.jpg", (r) =>
    r.fulfill({ contentType: "image/png", body: Buffer.from(motif, "base64") }),
  );
  await page.reload();
  const widths = [250, 150, 300, 200, 300];
  for (let i = 1; i < widths.length; i++)
    await page.getByRole("button", { name: "Rückwand hinzufügen" }).click();
  for (let i = 0; i < widths.length; i++)
    await page
      .getByLabel("Breite", { exact: true })
      .nth(i)
      .fill(String(widths[i]));
  const samples = [25, 175, 295, 305, 425, 595, 605, 725, 895, 905, 1075, 1175];
  await expect
    .poll(async () =>
      page
        .locator("canvas")
        .evaluate((c: HTMLCanvasElement, points: number[]) => {
          const ctx = c.getContext("2d")!;
          return points.map((x) =>
            Array.from(
              ctx.getImageData(
                Math.floor((c.width * x) / 1200),
                Math.floor(c.height / 2),
                1,
                1,
              ).data,
            ).slice(0, 3),
          );
        }, samples),
    )
    .toEqual([
      [255, 0, 0],
      [0, 0, 255],
      [0, 0, 255],
      [0, 0, 255],
      [0, 0, 255],
      [255, 0, 0],
      [255, 0, 0],
      [255, 0, 0],
      [0, 0, 255],
      [0, 0, 255],
      [255, 0, 0],
      [255, 0, 0],
    ]);
});

test("matches supplied desktop and mobile reference composition", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() =>
    localStorage.setItem(
      "r24-plates",
      JSON.stringify({
        version: 1,
        plates: [
          { id: "reference-1", width: 250, height: 128 },
          { id: "reference-2", width: 30, height: 30 },
        ],
      }),
    ),
  );
  await page.setViewportSize({ width: 1504, height: 902 });
  await page.reload();
  await page.getByLabel("Breite", { exact: true }).nth(1).focus();
  await page.getByLabel("Breite", { exact: true }).nth(1).blur();
  await expect(page.getByText("Motiv wird geladen …")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Rückwand 2 bearbeiten" }),
  ).toHaveAttribute("aria-expanded", "true");
  await page.waitForTimeout(200);
  await page.screenshot({ path: "screenshots/desktop.png", fullPage: true });
  await page.setViewportSize({ width: 400, height: 724 });
  await page.getByLabel("Breite", { exact: true }).nth(1).fill("20");
  await page.getByLabel("Breite", { exact: true }).nth(1).blur();
  await page.waitForTimeout(200);
  await page.screenshot({ path: "screenshots/mobile.png", fullPage: true });
  await page.getByRole("button", { name: "Rückwand 1 bearbeiten" }).click();
  await expect(
    page.getByRole("button", { name: "Rückwand 1 bearbeiten" }),
  ).toHaveAttribute("aria-expanded", "true");
  await page.setViewportSize({ width: 320, height: 720 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("touch configuration works with a high-DPI mobile canvas", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  await page.goto("/");
  await page.getByRole("button", { name: "Rückwand hinzufügen" }).tap();
  await expect(page.getByLabel("Breite", { exact: true })).toHaveCount(2);
  await page.getByRole("button", { name: "Rückwand 1 bearbeiten" }).tap();
  await expect(
    page.getByRole("button", { name: "Rückwand 1 bearbeiten" }),
  ).toHaveAttribute("aria-expanded", "true");
  const input = page.getByLabel("Breite", { exact: true }).first();
  await input.tap();
  await input.fill("150,25");
  await input.blur();
  await expect(input).toHaveValue("150,25");
  await page.getByRole("button", { name: "Rückwand 2 entfernen" }).tap();
  await expect(page.getByLabel("Breite", { exact: true })).toHaveCount(1);
  await expect
    .poll(() =>
      page
        .locator("canvas")
        .evaluate((c: HTMLCanvasElement) =>
          Math.abs(
            c.width - c.getBoundingClientRect().width * devicePixelRatio,
          ),
        ),
    )
    .toBeLessThanOrEqual(1);
  await context.close();
});

test("bonus tools: custom motif, PNG, units, locale and reload", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByText("Weitere Optionen", { exact: true }).click();
  const image = await page.evaluate(() => {
    const c = document.createElement("canvas");
    c.width = 300;
    c.height = 128;
    const x = c.getContext("2d")!;
    x.fillStyle = "red";
    x.fillRect(0, 0, 150, 128);
    x.fillStyle = "blue";
    x.fillRect(150, 0, 150, 128);
    return c.toDataURL().split(",")[1];
  });
  await page.getByLabel("Eigenes Motiv auswählen").setInputFiles({
    name: "asymmetric.png",
    mimeType: "image/png",
    buffer: Buffer.from(image, "base64"),
  });
  await expect(page.getByText(/asymmetric.png/)).toBeVisible();
  await expect(
    page.getByRole("button", { name: "PNG exportieren" }),
  ).toBeEnabled();
  await expect
    .poll(() =>
      page.locator("canvas").evaluate((c: HTMLCanvasElement) => {
        const pixel = c
          .getContext("2d")!
          .getImageData(
            Math.floor(c.width * 0.2),
            Math.floor(c.height / 2),
            1,
            1,
          ).data;
        return [...pixel].slice(0, 3);
      }),
    )
    .toEqual([255, 0, 0]);
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "PNG exportieren" }).click();
  const png = await download;
  expect(png.suggestedFilename()).toBe("rueckwand24-vorschau.png");
  const stream = await png.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  const buffer = Buffer.concat(chunks);
  expect(buffer.subarray(1, 4).toString()).toBe("PNG");
  expect(buffer.readUInt32BE(16)).toBe(500);
  expect(buffer.readUInt32BE(20)).toBe(256);
  await page.getByLabel("Einheit", { exact: true }).selectOption("in");
  const width = page.getByLabel("Breite", { exact: true });
  await width.fill("10,5");
  await width.blur();
  await expect(width).toHaveValue("10,5");
  await width.fill("999");
  await width.blur();
  await expect(width).toHaveValue("10,5");
  await page.getByLabel("Zahlenformat", { exact: true }).selectOption("en-US");
  await expect(page.getByLabel("Breite", { exact: true })).toHaveValue("10.5");
  await page.reload();
  await page.getByText("Weitere Optionen", { exact: true }).click();
  await expect(page.getByLabel("Einheit", { exact: true })).toHaveValue("in");
  await expect(page.getByLabel("Zahlenformat", { exact: true })).toHaveValue(
    "en-US",
  );
  await expect(page.getByLabel("Breite", { exact: true })).toHaveValue("10.5");
  await page.getByLabel("Einheit", { exact: true }).selectOption("cm");
  await expect(page.getByLabel("Breite", { exact: true })).toHaveValue("26.67");
  await page.getByLabel("Eigenes Motiv auswählen").setInputFiles({
    name: "broken.png",
    mimeType: "image/png",
    buffer: Buffer.from("invalid"),
  });
  await expect(page.getByRole("alert")).toContainText("nicht gelesen");
  await page
    .getByRole("button", { name: "Standardmotiv", exact: true })
    .click();
  await expect(page.getByRole("alert")).toHaveCount(0);
});

test("bonus reorder with mouse drag, keyboard and touch alternatives; reduced motion", async ({
  page,
  browser,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: "Rückwand hinzufügen" }).click();
  await page.getByLabel("Breite", { exact: true }).first().fill("100");
  await page.getByLabel("Breite", { exact: true }).nth(1).fill("200");
  await page.getByText("Weitere Optionen", { exact: true }).click();
  await page.getByRole("button", { name: "Reihenfolge ändern" }).click();
  await page
    .getByRole("button", { name: "Rückwand 1 ziehen" })
    .dragTo(page.getByRole("article", { name: "Rückwand 2", exact: true }));
  await expect(page.getByLabel("Breite", { exact: true }).first()).toHaveValue(
    "200",
  );
  await page.getByRole("button", { name: "Rückwand 1 ziehen" }).focus();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByLabel("Breite", { exact: true }).first()).toHaveValue(
    "100",
  );
  expect(
    await page
      .getByRole("article")
      .first()
      .evaluate((e) => getComputedStyle(e).animationName),
  ).toBe("none");
  await page.reload();
  await expect(page.getByLabel("Breite", { exact: true }).first()).toHaveValue(
    "100",
  );
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const touch = await context.newPage();
  await touch.goto("/");
  await touch.getByRole("button", { name: "Rückwand hinzufügen" }).tap();
  await touch.getByLabel("Breite", { exact: true }).first().fill("100");
  await touch.getByText("Weitere Optionen", { exact: true }).tap();
  await touch.getByRole("button", { name: "Reihenfolge ändern" }).tap();
  await touch.getByRole("button", { name: "Rückwand 1 nach unten" }).tap();
  await expect(touch.getByLabel("Breite", { exact: true }).nth(1)).toHaveValue(
    "100",
  );
  expect(
    await touch.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await touch.waitForTimeout(220);
  const rows = await touch.getByRole("article").all();
  const first = await rows[0].boundingBox();
  const second = await rows[1].boundingBox();
  expect(first!.y + first!.height).toBeLessThanOrEqual(second!.y);
  await touch.screenshot({
    path: "screenshots/mobile-options.png",
    fullPage: true,
  });
  await context.close();
});

test("highlights only edited or newly added plates and shows the validation banner", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Rückwand 1 bearbeiten" }),
  ).toHaveAttribute("aria-expanded", "false");
  await page.getByRole("button", { name: "Rückwand hinzufügen" }).click();
  await expect(
    page.getByRole("button", { name: "Rückwand 2 bearbeiten" }),
  ).toHaveAttribute("aria-expanded", "true");
  await page.getByRole("button", { name: "Rückwand 2 entfernen" }).click();
  await expect(page.getByLabel("Breite", { exact: true })).toHaveCount(1);
  await expect(
    page.getByRole("button", { name: "Rückwand 1 bearbeiten" }),
  ).toHaveAttribute("aria-expanded", "false");
  const height = page.getByLabel("Höhe", { exact: true });
  await height.focus();
  await expect(
    page.getByRole("button", { name: "Rückwand 1 bearbeiten" }),
  ).toHaveAttribute("aria-expanded", "true");
  const cardBefore = await page.getByRole("article").boundingBox();
  await height.fill("0");
  const cardAfter = await page.getByRole("article").boundingBox();
  expect(cardAfter!.y).toBe(cardBefore!.y);
  expect(cardAfter!.height).toBe(cardBefore!.height);
  await expect(height).toHaveValue("0");
  await expect(height).toHaveAttribute("aria-invalid", "true");
  const error = page.getByRole("alert");
  await expect(error).toContainText(
    "Die Höhe muss zwischen 30 und 128 cm liegen",
  );
  await expect(height).toHaveAttribute(
    "aria-describedby",
    (await error.getAttribute("id")) ?? "",
  );
  for (const width of [1440, 700, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    const banner = await error.boundingBox();
    const card = await page.getByRole("article").boundingBox();
    expect(banner!.y).toBeLessThan(card!.y);
    expect(banner!.y + banner!.height).toBeGreaterThan(card!.y);
    expect(banner!.x).toBeGreaterThanOrEqual(card!.x);
    expect(banner!.x + banner!.width).toBeLessThanOrEqual(
      card!.x + card!.width,
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(250);
  await page.screenshot({
    path: "screenshots/validation-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(250);
  await page.screenshot({
    path: "screenshots/validation-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await height.blur();
  await expect(height).toHaveValue("128");
  await expect(error).toHaveCount(0);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Rückwand 1 bearbeiten" }),
  ).toHaveAttribute("aria-expanded", "false");
  await page.getByRole("button", { name: "Rückwand hinzufügen" }).click();
  await page.getByRole("button", { name: "Rückwand 1 entfernen" }).click();
  await expect(page.getByLabel("Breite", { exact: true })).toHaveCount(1);
  await expect(
    page.getByRole("button", { name: "Rückwand 1 bearbeiten" }),
  ).toHaveAttribute("aria-expanded", "true");
});
