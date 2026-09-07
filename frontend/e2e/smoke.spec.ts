import { expect, test } from "@playwright/test";

test.describe("landing page", () => {
  test("shows the hero section and navigation entry points", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: "Professional Stock Analysis Platform" })
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Start Analyzing" })).toBeVisible();
    await expect(page.getByRole("link", { name: /View Portfolio/ })).toBeVisible();
  });
});

test.describe("options calculator", () => {
  test("prices an at-the-money call with the default parameters", async ({
    page,
  }) => {
    await page.goto("/options");

    await expect(
      page.getByRole("heading", { name: "Options Pricing" })
    ).toBeVisible();

    await page.getByRole("button", { name: "Calculate Option Price" }).click();

    await expect(
      page.getByRole("heading", { name: "Option Valuation" })
    ).toBeVisible();
    // S=100, K=100, T=0.25, r=5%, sigma=20% -> Black-Scholes call ~= $4.615
    // ATM: time value equals the option price, so the amount renders twice
    await expect(page.getByText(/\$4\.61\d{2}/).first()).toBeVisible();

    await expect(page.getByRole("heading", { name: "Option Greeks" })).toBeVisible();
    await expect(page.getByText("Delta", { exact: true })).toBeVisible();
  });
});
