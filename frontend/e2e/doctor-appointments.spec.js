import { test, expect } from "@playwright/test";
import { login, DOCTOR } from "./helpers";

// Status changes can't be undone on the real database, so these tests serve
// fake appointments and answer the status PATCH themselves. Login is real.

const ymd = (offsetDays) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const longDate = (day) =>
  new Date(`${day}T00:00:00Z`).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", timeZone: "UTC",
  });

const appt = (id, day, timeSlot, duration, status, patient, service) => ({
  _id: id,
  date: `${ymd(day)}T00:00:00.000Z`,
  timeSlot,
  duration,
  status,
  patient: { _id: `p-${id}`, name: patient },
  doctor: { _id: "d1", name: "Dr. Mei Chen", specialization: "Orthodontics" },
  service: { _id: `s-${id}`, name: service },
});

// Fake API: GET returns the current list, PATCH changes it (or fails on demand).
async function fakeAppointments(page, { failPatchWith } = {}) {
  const list = [
    appt("a3", 0, "14:00", 90, "cancelled", "Priya Nair", "Teeth Whitening"),
    appt("a1", 0, "09:00", 45, "confirmed", "Elena Reyes", "Teeth Cleaning"),
    appt("a2", 0, "10:30", 60, "pending", "Carlos Mendoza", "Tooth Filling"),
    appt("a5", 2, "11:00", 30, "confirmed", "Ana Cruz", "Dental Check-up"),
    appt("a4", 1, "09:00", 30, "pending", "Sam Kim", "Dental Check-up"),
    appt("a0", -1, "09:00", 30, "completed", "Old Visit", "Teeth Cleaning"),
  ];
  const patches = [];

  await page.route("**/api/appointments/myAppointments", (route) =>
    route.fulfill({
      json: { status: "success", results: list.length, data: { appointments: list } },
    }),
  );
  await page.route("**/api/appointments/*/status", async (route) => {
    const id = route.request().url().split("/").at(-2);
    const body = route.request().postDataJSON();
    patches.push({ id, ...body });
    if (failPatchWith) {
      return route.fulfill({
        status: 409,
        json: { status: "fail", message: failPatchWith, code: "INVALID_STATUS_TRANSITION" },
      });
    }
    const a = list.find((x) => x._id === id);
    a.status = body.status;
    return route.fulfill({ json: { status: "success", data: { appointment: a } } });
  });
  return patches;
}

test.describe("Doctor appointments (desktop)", () => {
  test("Today lists today's visits in time order with the right actions", async ({ page }) => {
    await fakeAppointments(page);
    await login(page, DOCTOR);
    await page.goto("/doctor/appointments");

    await expect(page.getByRole("heading", { level: 1, name: longDate(ymd(0)) })).toBeVisible();
    await expect(page.getByText("3 appointments · 1 waiting for confirmation")).toBeVisible();

    const rows = page.getByRole("row");
    await expect(rows).toHaveCount(4); // header + 3 visits
    await expect(rows.nth(1)).toContainText("Elena Reyes");
    await expect(rows.nth(2)).toContainText("Carlos Mendoza");
    await expect(rows.nth(3)).toContainText("Priya Nair");

    const elena = page.getByRole("row", { name: /Elena Reyes/ });
    await expect(elena).toContainText("9:00 – 9:45 AM");
    await expect(elena.getByRole("button", { name: "Complete" })).toBeVisible();
    await expect(elena.getByRole("button", { name: "No-show" })).toBeVisible();

    const carlos = page.getByRole("row", { name: /Carlos Mendoza/ });
    await expect(carlos.getByRole("button")).toHaveText(["Confirm"]);

    const priya = page.getByRole("row", { name: /Priya Nair/ });
    await expect(priya.getByRole("button")).toHaveCount(0);
    await expect(priya).toContainText("—");

    await expect(page.getByText("Sam Kim")).toHaveCount(0);   // tomorrow
    await expect(page.getByText("Old Visit")).toHaveCount(0); // yesterday
  });

  test("Upcoming groups later visits under a heading per day", async ({ page }) => {
    await fakeAppointments(page);
    await login(page, DOCTOR);
    await page.goto("/doctor/appointments");
    await page.getByRole("button", { name: "Upcoming" }).click();

    await expect(page.getByRole("heading", { level: 1, name: "Upcoming" })).toBeVisible();
    const days = page.getByRole("heading", { level: 2 });
    await expect(days).toHaveText([longDate(ymd(1)), longDate(ymd(2))]);
    await expect(page.getByRole("row", { name: /Sam Kim/ }).getByRole("button")).toHaveText(["Confirm"]);
    await expect(page.getByRole("row", { name: /Ana Cruz/ })).toBeVisible();
    await expect(page.getByText("Elena Reyes")).toHaveCount(0);
  });

  test("Complete asks first, then saves and updates the row", async ({ page }) => {
    const patches = await fakeAppointments(page);
    await login(page, DOCTOR);
    await page.goto("/doctor/appointments");
    const elena = page.getByRole("row", { name: /Elena Reyes/ });
    const dialog = page.getByRole("alertdialog");

    // "Not now" closes without saving
    await elena.getByRole("button", { name: "Complete" }).click();
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading")).toHaveText("Mark Elena Reyes's visit as completed?");
    await dialog.getByRole("button", { name: "Not now" }).click();
    await expect(dialog).toBeHidden();
    expect(patches).toHaveLength(0);

    await elena.getByRole("button", { name: "Complete" }).click();
    await dialog.getByRole("button", { name: "Complete" }).click();
    await expect(dialog).toBeHidden();
    expect(patches).toEqual([{ id: "a1", status: "completed" }]);
    await expect(elena).toContainText("Completed");
    await expect(elena.getByRole("button")).toHaveCount(0);
    await expect(page.getByText("3 appointments · 1 waiting for confirmation")).toBeVisible();
  });

  test("A failed change shows the server's reason in the modal", async ({ page }) => {
    await fakeAppointments(page, {
      failPatchWith: "Can't change an appointment from cancelled to confirmed...",
    });
    await login(page, DOCTOR);
    await page.goto("/doctor/appointments");

    await page.getByRole("row", { name: /Carlos Mendoza/ }).getByRole("button", { name: "Confirm" }).click();
    const dialog = page.getByRole("alertdialog");
    await dialog.getByRole("button", { name: "Confirm" }).click();
    await expect(dialog.getByRole("heading")).toHaveText("We couldn't update this appointment");
    await expect(dialog).toContainText("Can't change an appointment from cancelled to confirmed...");
    await dialog.getByRole("button", { name: "Close" }).click();
    await expect(dialog).toBeHidden();
  });
});

test.describe("Doctor appointments on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("cards show the actions, Confirm works, and the page fits", async ({ page }) => {
    const patches = await fakeAppointments(page);
    await login(page, DOCTOR);
    await page.goto("/doctor/appointments");

    const carlos = page.getByRole("listitem").filter({ hasText: "Carlos Mendoza" });
    await expect(carlos).toContainText("10:30 AM");
    await carlos.getByRole("button", { name: "Confirm" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Confirm" }).click();
    await expect(page.getByRole("alertdialog")).toBeHidden();
    expect(patches).toEqual([{ id: "a2", status: "confirmed" }]);
    await expect(carlos.getByRole("button", { name: "Complete" })).toBeVisible();
    await expect(page.getByText("3 appointments")).toBeVisible();

    const width = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(width).toBeLessThanOrEqual(390);
  });
});
