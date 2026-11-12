import { test, expect } from "@playwright/test";
import { login, openFromAccountMenu, DOCTOR, PATIENT_A } from "./helpers";

test.describe("Doctor portal layout", () => {
  test("A doctor sees their portal and can move between its pages", async ({ page }) => {
    await login(page, DOCTOR);
    await openFromAccountMenu(page, "Doctor portal");
    await expect(page).toHaveURL("/doctor/appointments");

    const sidebar = page.locator("aside");
    await expect(sidebar.getByText("Dr. Mei Chen")).toBeVisible();
    // the pill next to the logo (the account menu also has a "Doctor portal" link, hidden until opened)
    await expect(page.locator("header").getByText("Doctor portal", { exact: true }).first()).toBeVisible();

    await sidebar.getByRole("link", { name: "Schedule" }).click();
    await expect(page).toHaveURL("/doctor/schedule");
    await sidebar.getByRole("link", { name: "Profile" }).click();
    await expect(page).toHaveURL("/doctor/profile");
  });

  test("A doctor's account menu has no patient-only Account settings link", async ({ page }) => {
    await login(page, DOCTOR);
    await page.locator('button[aria-haspopup="menu"]').click();
    await expect(page.getByRole("menuitem", { name: "Doctor portal" })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Account settings" })).toHaveCount(0);
  });

  test("A patient can't open the doctor portal", async ({ page }) => {
    await login(page, PATIENT_A);
    await page.goto("/doctor/appointments");
    await expect(page.getByRole("heading", { name: "You don't have access to this page" })).toBeVisible();
  });
});

test.describe("Doctor portal on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("fits the screen, uses tabs, and logs out from the avatar menu", async ({ page }) => {
    await login(page, DOCTOR);
    await page.goto("/doctor/appointments");

    for (const url of ["/doctor/appointments", "/doctor/schedule", "/doctor/profile"]) {
      await page.goto(url);
      const width = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(width, `${url} is ${width}px wide on a 390px screen`).toBeLessThanOrEqual(390);
    }

    const tabs = page.getByRole("navigation", { name: "Doctor portal" });
    await tabs.getByRole("link", { name: "Appointments" }).click();
    await expect(page).toHaveURL("/doctor/appointments");

    await page.locator('button[aria-haspopup="menu"]').click();
    await page.getByRole("menuitem", { name: "Log out" }).click();
    await expect(page).toHaveURL("/");
  });
});
