import { expect } from "@playwright/test";

// Seed patients from backend/dentalClinic/dev-data/users.json (demo password from the seed).
export const PASSWORD = process.env.E2E_PASSWORD ?? "Demo1234!";
export const PATIENT_A = "elena.reyes@example.com";
export const PATIENT_B = "carlos.mendoza@example.com";
export const DOCTOR = "mei.chen@toothfairy.example";

// Fill and submit the login form that is already on screen.
export async function submitLogin(page, email, password = PASSWORD) {
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  // logged in = the app has left the login page (the button label changes
  // to "Logging in..." straight away, so it can't tell us we're done)
  await expect(page).not.toHaveURL(/\/login/);
}

// Fresh start: load /login, then log in.
export async function login(page, email, password = PASSWORD) {
  await page.goto("/login");
  await submitLogin(page, email, password);
}

// Open a page from the header's account menu: an in-app click, no page reload.
export async function openFromAccountMenu(page, item) {
  await page.locator('button[aria-haspopup="menu"]').click();
  await page.getByRole("menuitem", { name: item }).click();
}
