import { test, expect } from "@playwright/test";
import { login, PATIENT_A } from "./helpers";

// A phone-sized window. Every page must fit it without sideways scrolling.
test.use({ viewport: { width: 390, height: 844 } });

const GUEST_PAGES = [
  "/",
  "/services",
  "/doctors",
  "/reviews",
  "/login",
  "/signup",
  "/forgot-password",
  "/book",
  "/this-page-does-not-exist",
];
const PATIENT_PAGES = ["/", "/account/appointments", "/account/settings", "/book"];

async function expectFitsScreen(page, url) {
  await page.goto(url);
  await page.waitForLoadState("networkidle");
  const width = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(width, `${url} is ${width}px wide on a 390px screen`).toBeLessThanOrEqual(390);
}

test("Guest pages fit a phone screen", async ({ page, request }) => {
  const res = await request.get("http://localhost:3000/api/services");
  const slug = (await res.json()).data.services[0].slug;

  for (const url of [...GUEST_PAGES, `/services/${slug}`]) {
    await expectFitsScreen(page, url);
  }
});

test("Patient pages fit a phone screen", async ({ page }) => {
  await login(page, PATIENT_A);
  for (const url of PATIENT_PAGES) {
    await expectFitsScreen(page, url);
  }
});

test("Guest: the mobile menu opens, links work, and it closes after a tap", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Menu" }).click();

  const menu = page.getByRole("dialog", { name: "Menu" });
  await expect(menu).toBeVisible();
  for (const name of ["Home", "Services", "Our dentists", "Reviews"]) {
    await expect(menu.getByRole("link", { name, exact: true })).toBeVisible();
  }
  await expect(menu.getByRole("link", { name: "Log in" })).toBeVisible();

  await menu.getByRole("link", { name: "Reviews", exact: true }).click();
  await expect(page).toHaveURL("/reviews");
  await expect(menu).toBeHidden();
});

test("Guest: Close and Esc both close the menu", async ({ page }) => {
  await page.goto("/");
  const menu = page.getByRole("dialog", { name: "Menu" });

  await page.getByRole("button", { name: "Menu" }).click();
  await menu.getByRole("button", { name: "Close" }).click();
  await expect(menu).toBeHidden();

  await page.getByRole("button", { name: "Menu" }).click();
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
});

test("Patient: the menu shows their pages, and Log out works", async ({ page }) => {
  await login(page, PATIENT_A);
  await page.getByRole("button", { name: "Menu" }).click();
  const menu = page.getByRole("dialog", { name: "Menu" });

  await expect(menu.getByText("Elena Reyes")).toBeVisible();
  await expect(menu.getByRole("link", { name: "Account settings" })).toBeVisible();
  await menu.getByRole("link", { name: "My appointments" }).click();
  await expect(page).toHaveURL("/account/appointments");
  await expect(menu).toBeHidden();

  await page.getByRole("button", { name: "Menu" }).click();
  await menu.getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL("/");

  await page.getByRole("button", { name: "Menu" }).click();
  await expect(menu.getByRole("link", { name: "Log in" })).toBeVisible();
});
