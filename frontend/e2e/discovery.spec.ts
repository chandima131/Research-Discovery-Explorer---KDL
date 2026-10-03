import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("research topic → results → profile → explore → network", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Research starts",
  );
  await page.getByRole("searchbox").fill("historical archives");
  await page.getByRole("button", { name: "Find researchers" }).click();
  await expect(page.locator(".results-heading [role='status']")).toContainText("researchers");
  await page.getByRole("link", { name: /Dr Maya Bennett/ }).click();
  await expect(
    page.getByRole("heading", { name: "Dr Maya Bennett" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Selected publications" }),
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Explore", exact: true })
    .click();
  await page.getByText("View data table", { exact: true }).first().click();
  await expect(page.getByRole("table").first()).toBeVisible();
  await page
    .getByRole("link", { name: "Research Network", exact: true })
    .click();
  await page
    .getByLabel("Research theme", { exact: true })
    .selectOption({ label: "Language & archives" });
  await expect(page.getByRole("table")).toContainText("Maya Bennett");
});

test("home, search, details, charts, network and information pages have no automated WCAG AA violations", async ({
  page,
}) => {
  for (const path of [
    "/",
    "/researchers?q=historical",
    "/researchers/1",
    "/explore",
    "/network",
    "/methodology",
    "/accessibility",
    "/ethics",
  ]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator(".loading")).toHaveCount(0);
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(result.violations, path).toEqual([]);
  }
});

test("keyboard navigation, mobile reflow and empty-state recovery", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to content" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
  await page.getByRole("searchbox").fill("unfindablewordzz");
  await page.getByRole("button", { name: "Find researchers" }).click();
  await expect(
    page.getByRole("heading", { name: "No researchers found" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Browse all researchers" }).click();
  await expect(page.locator(".researcher-card")).toHaveCount(12);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
