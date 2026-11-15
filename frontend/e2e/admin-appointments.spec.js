import { test, expect } from "@playwright/test";
import { login, ADMIN, PATIENT_A } from "./helpers";

// Fake list: the real one changes as other tests and people book.

const today = new Date().toLocaleDateString("en-CA");
const MEI = { _id: "d1", id: "d1", name: "Dr. Mei Chen" };
const ANA = { _id: "d2", id: "d2", name: "Dr. Ana Santos" };

const appt = (i, { date, time = "09:00", status = "confirmed", patient = `Patient ${i}`, doctor = MEI } = {}) => ({
  _id: `a${i}`,
  date: `${date}T00:00:00.000Z`,
  timeSlot: time,
  duration: 30,
  price: 80,
  status,
  patient: { _id: `p${i}`, name: patient },
  doctor: { _id: doctor._id, name: doctor.name, specialization: "General" },
  service: { _id: "s1", name: "Teeth Cleaning" },
});

// 10 future visits (sent out of order), one today, one in the past
const APPOINTMENTS = [
  ...[7, 3, 9, 1, 5, 10, 2, 8, 4, 6].map((d) => appt(d, { date: `2030-01-${String(d).padStart(2, "0")}` })),
  appt(11, { date: today, time: "10:30", status: "pending", patient: "Elena Reyes", doctor: ANA }),
  appt(12, { date: "2020-05-01", status: "cancelled", patient: "Carlos Mendoza" }),
];

// a fresh copy per test, so status changes don't leak into the next test
async function fakeAdminData(page) {
  const appointments = structuredClone(APPOINTMENTS);
  const patches = [];
  await page.route("**/api/appointments", (route) =>
    route.fulfill({ json: { status: "success", results: appointments.length, data: { appointments } } }),
  );
  // one appointment (the detail page); unknown ids get a 404
  await page.route("**/api/appointments/*", (route) => {
    const id = new URL(route.request().url()).pathname.split("/").pop();
    const appointment = appointments.find((a) => a._id === id);
    if (!appointment) return route.fulfill({ status: 404, json: { status: "fail", message: "No appointments were found..." } });
    return route.fulfill({ json: { status: "success", data: { appointment } } });
  });
  // a status change: recorded and applied
  await page.route("**/api/appointments/*/status", (route) => {
    const id = new URL(route.request().url()).pathname.split("/").at(-2);
    const body = route.request().postDataJSON();
    patches.push({ id, ...body });
    const appointment = appointments.find((a) => a._id === id);
    Object.assign(appointment, body);
    return route.fulfill({ json: { status: "success", data: { appointment } } });
  });
  await page.route("**/api/doctors", (route) =>
    route.fulfill({ json: { status: "success", results: 2, data: { doctors: [MEI, ANA] } } }),
  );
  return patches;
}

const bodyRows = (page) => page.getByRole("main").locator("tbody tr");

test.describe("Admin appointments (desktop)", () => {
  test("every appointment in time order, 10 per page", async ({ page }) => {
    await fakeAdminData(page);
    await login(page, ADMIN);
    await page.goto("/admin/appointments");

    await expect(page.getByRole("heading", { level: 1, name: "Appointments" })).toBeVisible();
    await expect(bodyRows(page)).toHaveCount(10);
    await expect(bodyRows(page).first()).toContainText("May 1, 2020 · 9:00 AM");
    await expect(bodyRows(page).first()).toContainText("Carlos Mendoza");
    await expect(bodyRows(page).nth(1)).toContainText("Elena Reyes");
    await expect(bodyRows(page).nth(2)).toContainText("Jan 1, 2030");
    await expect(page.getByText("Showing 1–10 of 12")).toBeVisible();
    await expect(page.getByRole("button", { name: "‹ Prev" })).toBeDisabled();

    await page.getByRole("button", { name: "Next ›" }).click();
    await expect(bodyRows(page)).toHaveCount(2);
    await expect(page.getByText("Showing 11–12 of 12")).toBeVisible();
    await expect(page.getByRole("button", { name: "Next ›" })).toBeDisabled();
  });

  test("filters by status, dentist, date and patient name", async ({ page }) => {
    await fakeAdminData(page);
    await login(page, ADMIN);
    await page.goto("/admin/appointments");

    // a filter change goes back to page 1
    await page.getByRole("button", { name: "Next ›" }).click();
    await page.getByLabel("Status").selectOption("cancelled");
    await expect(bodyRows(page)).toHaveCount(1);
    await expect(bodyRows(page)).toContainText("Carlos Mendoza");
    await expect(page.getByText("Showing 1–1 of 1")).toBeVisible();
    await page.getByLabel("Status").selectOption("");

    await page.getByLabel("Dentist").selectOption({ label: "Dr. Ana Santos" });
    await expect(bodyRows(page)).toHaveCount(1);
    await expect(bodyRows(page)).toContainText("Elena Reyes");
    await page.getByLabel("Dentist").selectOption("");

    await page.getByLabel("Date").selectOption("today");
    await expect(bodyRows(page)).toHaveCount(1);
    await expect(bodyRows(page)).toContainText("Elena Reyes");
    await page.getByLabel("Date").selectOption("past");
    await expect(bodyRows(page)).toContainText("Carlos Mendoza");
    await page.getByLabel("Date").selectOption("");

    await page.getByLabel("Search").fill("ELENA");
    await expect(bodyRows(page)).toHaveCount(1);
    await page.getByLabel("Status").selectOption("completed");
    await expect(page.getByText("No appointments match these filters.")).toBeVisible();
  });

  test("View › opens the detail, and the back link returns", async ({ page }) => {
    await fakeAdminData(page);
    await login(page, ADMIN);
    await page.goto("/admin/appointments");

    await bodyRows(page).filter({ hasText: "Elena Reyes" }).getByRole("link", { name: /^View Elena Reyes/ }).click();
    await expect(page).toHaveURL("/admin/appointments/a11");
    await expect(page.getByRole("heading", { level: 1, name: "Elena Reyes" })).toBeVisible();
    const details = page.locator("dl");
    for (const text of ["Dr. Ana Santos", "Teeth Cleaning", "10:30 – 11:00 AM", "30 min", "$80"]) {
      await expect(details).toContainText(text);
    }
    await expect(page.getByRole("main").getByText("Pending", { exact: true })).toBeVisible();
    // pending: confirm or cancel
    await expect(page.getByRole("main").getByRole("button")).toHaveText(["Confirm", "Cancel appointment"]);

    await page.getByRole("main").getByRole("link", { name: "Appointments" }).click();
    await expect(page).toHaveURL("/admin/appointments");
  });

  test("cancelling asks first, takes an optional reason, and shows it", async ({ page }) => {
    const patches = await fakeAdminData(page);
    await login(page, ADMIN);
    await page.goto("/admin/appointments/a11");
    const dialog = page.getByRole("alertdialog");

    await page.getByRole("button", { name: "Cancel appointment" }).click();
    await expect(dialog.getByRole("heading")).toHaveText("Cancel Elena Reyes's appointment?");
    await dialog.getByLabel("Reason (optional)").fill("  The dentist is unwell  ");
    await dialog.getByRole("button", { name: "Yes, cancel" }).click();
    await expect(dialog).toBeHidden();

    expect(patches).toEqual([{ id: "a11", status: "cancelled", cancellationReason: "The dentist is unwell" }]);
    await expect(page.getByText('"The dentist is unwell"')).toBeVisible();
    // cancelled is final: no more actions
    await expect(page.getByRole("main").getByRole("button")).toHaveCount(0);
  });

  test("a confirmed visit can be completed (or no-show / cancel), asking first", async ({ page }) => {
    const patches = await fakeAdminData(page);
    await login(page, ADMIN);
    await page.goto("/admin/appointments/a1");
    const dialog = page.getByRole("alertdialog");

    await expect(page.getByRole("main").getByRole("button")).toHaveText(["Mark completed", "Mark no-show", "Cancel appointment"]);
    await page.getByRole("button", { name: "Mark completed" }).click();
    await expect(dialog.getByRole("heading")).toHaveText("Mark Patient 1's visit as completed?");
    await dialog.getByRole("button", { name: "Not now" }).click();
    expect(patches).toEqual([]);

    await page.getByRole("button", { name: "Mark completed" }).click();
    await dialog.getByRole("button", { name: "Complete" }).click();
    await expect(dialog).toBeHidden();
    expect(patches).toEqual([{ id: "a1", status: "completed" }]);
    await expect(page.getByRole("main").getByText("Completed", { exact: true })).toBeVisible();
    await expect(page.getByRole("main").getByRole("button")).toHaveCount(0);
  });

  test("a cancelled visit shows its reason box; an unknown id says so", async ({ page }) => {
    await fakeAdminData(page);
    await login(page, ADMIN);

    await page.goto("/admin/appointments/a12");
    await expect(page.getByRole("heading", { level: 1, name: "Carlos Mendoza" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Cancelled" })).toBeVisible();
    await expect(page.getByText("No reason given.")).toBeVisible();

    await page.goto("/admin/appointments/nope");
    await expect(page.getByText("We couldn't find this appointment.")).toBeVisible();
  });

  test("the admin portal has its own sidebar, and other roles can't open it", async ({ page }) => {
    await fakeAdminData(page);
    await login(page, ADMIN);
    await page.goto("/admin/appointments");

    const sidebar = page.getByRole("complementary");
    for (const name of ["Appointments", "Users", "Services", "Reviews"]) {
      await expect(sidebar.getByRole("link", { name })).toBeVisible();
    }
    await expect(page.getByRole("button", { name: /account menu/ })).toBeVisible();

    await sidebar.getByRole("button", { name: "Log out" }).click();
    await login(page, PATIENT_A);
    await page.goto("/admin/appointments");
    await expect(page.getByRole("heading", { name: "You don't have access to this page" })).toBeVisible();
  });
});

test.describe("Admin appointments on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("cards with a status filter, and the page fits", async ({ page }) => {
    await fakeAdminData(page);
    await login(page, ADMIN);
    await page.goto("/admin/appointments");

    const tabs = page.getByRole("navigation", { name: "Admin portal" });
    await expect(tabs.getByRole("link")).toHaveText(["Appointments", "Users", "Services", "Reviews"]);
    await expect(page.getByLabel("Status")).toBeVisible();
    await expect(page.getByLabel("Dentist")).toBeHidden();
    const firstCard = page.getByRole("main").getByRole("listitem").first();
    await expect(firstCard).toContainText("Carlos Mendoza");
    await firstCard.getByRole("link", { name: /^View Carlos Mendoza/ }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Carlos Mendoza" })).toBeVisible();
    await expect(page.locator("dl")).toContainText("Fri, May 1, 2020");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    await page.goBack();

    const width = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(width).toBeLessThanOrEqual(390);
  });
});
