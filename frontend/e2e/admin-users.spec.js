import { test, expect } from "@playwright/test";
import { login, ADMIN } from "./helpers";

// Fake users (except the admin's own account): role changes and deactivations must not touch real accounts.

// a MongoDB-style id whose first 8 hex digits are the creation time
const oid = (ymd, n) => Math.floor(Date.parse(`${ymd}T12:00:00Z`) / 1000).toString(16) + "0".repeat(15) + n;
const ELENA = oid("2026-09-02", 1);
const MEI = oid("2026-01-10", 2);
const CARLOS = oid("2026-09-20", 3);
const DUPLICATE = "This email is already in use. Please use a different one.";

// log in first: the admin's real account joins the fake list
async function fakeUsers(page) {
  const me = await page.evaluate(async () => {
    const res = await fetch("/api/users/myAccount", { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
    return (await res.json()).data.user;
  });
  const users = new Map(
    [
      { _id: ELENA, name: "Elena Reyes", email: "elena@example.com", role: "patient", active: true },
      { _id: MEI, name: "Dr. Mei Chen", email: "mei.chen@toothfairy.example", role: "doctor", active: true },
      { _id: CARLOS, name: "Carlos Mendoza", email: "carlos@example.com", role: "patient", active: false },
      { _id: me._id, name: me.name, email: me.email, role: "admin", active: true },
    ].map((u) => [u._id, u]),
  );
  const calls = [];

  await page.route("**/api/users", (route) =>
    route.fulfill({ json: { status: "success", results: users.size, data: { users: [...users.values()] } } }),
  );
  await page.route("**/api/users/*", (route) => {
    const request = route.request();
    const id = new URL(request.url()).pathname.split("/").pop();
    const user = users.get(id);
    if (!user) return route.fallback(); // myAccount, login, ...
    if (request.method() === "GET") return route.fulfill({ json: { status: "success", data: { user } } });
    if (request.method() === "DELETE") {
      calls.push({ method: "DELETE", id });
      user.active = false;
      return route.fulfill({ status: 204, body: "" });
    }
    const body = request.postDataJSON();
    calls.push({ method: "PATCH", id, body });
    if (body.email === "mei.chen@toothfairy.example" && id !== MEI) {
      return route.fulfill({ status: 409, json: { status: "fail", message: DUPLICATE } });
    }
    Object.assign(user, body);
    const answer = { ...user };
    delete answer.active; // the real PATCH answer has no `active`
    return route.fulfill({ json: { status: "success", data: { user: answer } } });
  });
  return { me, calls };
}

const bodyRows = (page) => page.getByRole("main").locator("tbody tr");
const save = (page) => page.getByRole("button", { name: "Save changes" });

test.describe("Admin users (desktop)", () => {
  test("lists everyone with role, join date and deactivated tag, with role filter and search", async ({ page }) => {
    await login(page, ADMIN);
    const { me } = await fakeUsers(page);
    await page.goto("/admin/users");

    await expect(page.getByRole("heading", { level: 1, name: "Users" })).toBeVisible();
    await expect(bodyRows(page)).toHaveCount(4);
    const elena = bodyRows(page).filter({ hasText: "Elena Reyes" });
    await expect(elena).toContainText("Patient");
    await expect(elena).toContainText("Sep 2, 2026");
    await expect(bodyRows(page).filter({ hasText: "Carlos Mendoza" })).toContainText("Deactivated");

    await page.getByRole("button", { name: "Dentists" }).click();
    await expect(bodyRows(page)).toHaveCount(1);
    await expect(bodyRows(page)).toContainText("Dr. Mei Chen");
    await page.getByRole("button", { name: "All" }).click();

    await page.getByLabel("Search").fill("TOOTHFAIRY");
    await expect(bodyRows(page)).toHaveCount(me.email.includes("toothfairy") ? 2 : 1);
    await page.getByLabel("Search").fill("zzz");
    await expect(page.getByText("No users match.")).toBeVisible();
  });

  test("edit a user's role and save", async ({ page }) => {
    await login(page, ADMIN);
    const { calls } = await fakeUsers(page);
    await page.goto("/admin/users");

    await page.getByRole("link", { name: "Edit Elena Reyes" }).click();
    await expect(page).toHaveURL(`/admin/users/${ELENA}`);
    await expect(page.getByRole("heading", { level: 1, name: "Elena Reyes" })).toBeVisible();
    await expect(save(page)).toBeDisabled();

    await page.getByLabel("Role").selectOption("doctor");
    await save(page).click();
    await expect(page.getByText("Changes saved.")).toBeVisible();
    await expect(save(page)).toBeDisabled();
    expect(calls).toEqual([
      { method: "PATCH", id: ELENA, body: { name: "Elena Reyes", email: "elena@example.com", role: "doctor" } },
    ]);
  });

  test("deactivate asks first, and the account can be reactivated", async ({ page }) => {
    await login(page, ADMIN);
    const { calls } = await fakeUsers(page);
    await page.goto(`/admin/users/${ELENA}`);
    const dialog = page.getByRole("alertdialog");

    await page.getByRole("button", { name: "Deactivate user" }).click();
    await expect(dialog.getByRole("heading")).toHaveText("Deactivate Elena Reyes?");
    await dialog.getByRole("button", { name: "Not now" }).click();
    await expect(dialog).toBeHidden();
    expect(calls).toEqual([]);

    await page.getByRole("button", { name: "Deactivate user" }).click();
    await dialog.getByRole("button", { name: "Deactivate" }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByRole("main").getByText("Deactivated", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Reactivate user" }).click();
    await expect(dialog.getByRole("heading")).toHaveText("Reactivate Elena Reyes?");
    await dialog.getByRole("button", { name: "Reactivate" }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByRole("button", { name: "Deactivate user" })).toBeVisible();

    expect(calls).toEqual([
      { method: "DELETE", id: ELENA },
      { method: "PATCH", id: ELENA, body: { active: true } },
    ]);
  });

  test("your own account: the role is locked and there's no deactivate", async ({ page }) => {
    await login(page, ADMIN);
    const { me } = await fakeUsers(page);
    await page.goto(`/admin/users/${me._id}`);

    await expect(page.getByLabel("Role")).toBeDisabled();
    await expect(page.getByText("This is your account, so you can't change your own role.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Deactivate user" })).toHaveCount(0);
  });

  test("a taken email shows the server's message inline", async ({ page }) => {
    await login(page, ADMIN);
    await fakeUsers(page);
    await page.goto(`/admin/users/${ELENA}`);

    await page.getByLabel("Email").fill("mei.chen@toothfairy.example");
    await save(page).click();
    await expect(page.getByRole("alert")).toHaveText(DUPLICATE);
    await expect(save(page)).toBeEnabled();
  });
});

test.describe("Admin users on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("cards with search, and the pages fit", async ({ page }) => {
    await login(page, ADMIN);
    await fakeUsers(page);
    await page.goto("/admin/users");

    await expect(page.getByLabel("Search")).toBeVisible();
    await expect(page.getByRole("main").getByRole("listitem").filter({ hasText: "Elena Reyes" })).toContainText("elena@example.com");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);

    await page.getByRole("link", { name: "Edit Elena Reyes" }).click();
    await expect(page.getByRole("button", { name: "Deactivate user" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  });
});
