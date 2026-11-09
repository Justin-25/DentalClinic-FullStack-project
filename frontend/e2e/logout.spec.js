import { test, expect } from "@playwright/test";
import {
  login,
  submitLogin,
  openFromAccountMenu,
  PATIENT_A,
  PATIENT_B,
} from "./helpers";

const appointmentCards = (page) =>
  page.locator('main a[href^="/account/appointments/"]');

test("Log out from the portal goes home, logged out, without a refresh", async ({ page }) => {
  await login(page, PATIENT_A);
  await openFromAccountMenu(page, "My appointments");
  await expect(page.getByRole("heading", { name: "My appointments" })).toBeVisible();

  await page.locator("aside").getByRole("button", { name: "Log out" }).click();

  await expect(page).toHaveURL("/");
  await expect(page.getByRole("link", { name: "Log in", exact: true })).toBeVisible();
});

// Everything below happens in ONE page session (clicks only, no page.goto),
// because a reload would wipe the cache and hide the bug.
test("The next patient on the same tab never sees the previous patient's appointments", async ({ page }) => {
  // Patient A loads their list, so it is now cached in memory.
  await login(page, PATIENT_A);
  await openFromAccountMenu(page, "My appointments");
  await expect(appointmentCards(page).first()).toBeVisible();

  await page.locator("aside").getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL("/");

  // Hold patient B's request: the page can then only show what is already cached.
  let release;
  const held = new Promise((resolve) => (release = resolve));
  await page.route("**/api/appointments/myAppointments", async (route) => {
    await held;
    await route.continue();
  });

  await page.getByRole("link", { name: "Log in", exact: true }).click();
  await submitLogin(page, PATIENT_B);
  await openFromAccountMenu(page, "My appointments");

  await expect(page.getByText("Loading your appointments...")).toBeVisible();
  await expect(appointmentCards(page)).toHaveCount(0);

  release();
  await page.unrouteAll({ behavior: "ignoreErrors" });
});
