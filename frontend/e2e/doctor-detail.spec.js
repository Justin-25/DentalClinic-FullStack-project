import { test, expect } from "@playwright/test";
import { login, DOCTOR } from "./helpers";

// Fake appointments again: status changes can't be undone on the real database.

const appt = (id, status, extra = {}) => ({
  _id: id,
  date: "2026-10-13T00:00:00.000Z",
  timeSlot: "09:00",
  duration: 45,
  price: 80,
  status,
  patient: { _id: "p1", name: "Elena Reyes" },
  doctor: { _id: "d1", name: "Dr. Mei Chen", specialization: "Orthodontics" },
  service: { _id: "s1", name: "Teeth Cleaning" },
  ...extra,
});

async function fakeDetail(page, appointment) {
  const patches = [];
  await page.route(`**/api/appointments/${appointment._id}`, (route) =>
    route.fulfill({ json: { status: "success", data: { appointment } } }),
  );
  await page.route(`**/api/appointments/${appointment._id}/status`, (route) => {
    const body = route.request().postDataJSON();
    patches.push(body);
    appointment.status = body.status;
    return route.fulfill({ json: { status: "success", data: { appointment } } });
  });
  await page.route("**/api/appointments/myAppointments", (route) =>
    route.fulfill({ json: { status: "success", data: { appointments: [appointment] } } }),
  );
  return patches;
}

test.describe("Doctor appointment detail (desktop)", () => {
  test("a confirmed visit shows its details and both status actions", async ({ page }) => {
    await fakeDetail(page, appt("a1", "confirmed"));
    await login(page, DOCTOR);
    await page.goto("/doctor/appointments/a1");

    await expect(page.getByRole("heading", { level: 1, name: "Elena Reyes" })).toBeVisible();
    const details = page.locator("dl");
    await expect(details).toContainText("Teeth Cleaning");
    await expect(details).toContainText("Tuesday, October 13, 2026");
    await expect(details).toContainText("9:00 – 9:45 AM");
    await expect(details).toContainText("45 min");
    await expect(details).toContainText("$80");

    await expect(page.getByRole("heading", { name: "Update status" })).toBeVisible();
    await expect(page.getByRole("main").getByRole("button")).toHaveText(["Mark completed", "Mark no-show"]);
  });

  test("Mark no-show asks first, saves, and the actions disappear", async ({ page }) => {
    const patches = await fakeDetail(page, appt("a1", "confirmed"));
    await login(page, DOCTOR);
    await page.goto("/doctor/appointments/a1");

    await page.getByRole("button", { name: "Mark no-show" }).click();
    const dialog = page.getByRole("alertdialog");
    await expect(dialog.getByRole("heading")).toHaveText("Mark Elena Reyes as a no-show?");
    await dialog.getByRole("button", { name: "No-show" }).click();
    await expect(dialog).toBeHidden();

    expect(patches).toEqual([{ status: "no-show" }]);
    await expect(page.getByRole("main").getByText("No-show", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Update status" })).toHaveCount(0);
  });

  test("after a failed save, the next action asks again instead of showing the old error", async ({ page }) => {
    await fakeDetail(page, appt("a1", "confirmed"));
    // registered last, so it wins over fakeDetail's PATCH: the server says no
    await page.route("**/api/appointments/a1/status", (route) =>
      route.fulfill({ status: 409, json: { status: "fail", message: "This appointment was already updated." } }),
    );
    await login(page, DOCTOR);
    await page.goto("/doctor/appointments/a1");

    const dialog = page.getByRole("alertdialog");
    await page.getByRole("button", { name: "Mark no-show" }).click();
    await dialog.getByRole("button", { name: "No-show" }).click();
    await expect(dialog.getByRole("heading")).toHaveText("We couldn't update this appointment");
    await expect(dialog).toContainText("This appointment was already updated.");
    await dialog.getByRole("button", { name: "Close" }).click();
    await expect(dialog).toBeHidden();

    await page.getByRole("button", { name: "Mark completed" }).click();
    await expect(dialog.getByRole("heading")).toHaveText("Mark Elena Reyes's visit as completed?");
  });

  test("a pending visit only offers Confirm", async ({ page }) => {
    await fakeDetail(page, appt("a2", "pending"));
    await login(page, DOCTOR);
    await page.goto("/doctor/appointments/a2");
    await expect(page.getByRole("main").getByRole("button")).toHaveText(["Confirm"]);
  });

  test("a cancelled visit shows the reason, or a fallback, and no actions", async ({ page }) => {
    await fakeDetail(page, appt("a3", "cancelled", { cancellationReason: "I have a work conflict." }));
    await fakeDetail(page, appt("a4", "cancelled"));
    await login(page, DOCTOR);

    await page.goto("/doctor/appointments/a3");
    await expect(page.getByText('"I have a work conflict."')).toBeVisible();
    await expect(page.getByRole("main").getByRole("button")).toHaveCount(0);

    await page.goto("/doctor/appointments/a4");
    await expect(page.getByText("No reason given.")).toBeVisible();
  });

  test("the list links to the detail page and back", async ({ page }) => {
    const a = appt("a5", "pending", { date: `${new Date().toLocaleDateString("en-CA")}T00:00:00.000Z` });
    await fakeDetail(page, a);
    await login(page, DOCTOR);
    await page.goto("/doctor/appointments");

    await page.getByRole("row", { name: /Elena Reyes/ }).getByRole("link", { name: "Elena Reyes" }).click();
    await expect(page).toHaveURL("/doctor/appointments/a5");
    // the back link inside the page, not the sidebar's "Appointments"
    await page.getByRole("main").getByRole("link", { name: "Appointments" }).click();
    await expect(page).toHaveURL("/doctor/appointments");
  });

  test("an unknown id shows a not-found message", async ({ page }) => {
    await page.route("**/api/appointments/nope", (route) =>
      route.fulfill({ status: 404, json: { status: "fail", message: "No appointments were found..." } }),
    );
    await login(page, DOCTOR);
    await page.goto("/doctor/appointments/nope");
    await expect(page.getByText("We couldn't find this appointment.")).toBeVisible();
  });
});

test.describe("Doctor appointment detail on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("buttons sit under the details, without the panel heading, and the page fits", async ({ page }) => {
    await fakeDetail(page, appt("a1", "confirmed"));
    await login(page, DOCTOR);
    await page.goto("/doctor/appointments/a1");

    await expect(page.locator("dl")).toContainText("Tue, Oct 13, 2026");
    await expect(page.getByRole("button", { name: "Mark completed" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Update status" })).toBeHidden();

    const width = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(width).toBeLessThanOrEqual(390);
  });
});
