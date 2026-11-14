import { test, expect } from "@playwright/test";
import { login, DOCTOR } from "./helpers";

// Fake schedule: saving a real one would change which slots patients can book.

const SCHEDULE = () => ({
  _id: "sch1",
  doctor: "d1",
  weeklyAvailability: [
    { _id: "b1", day: "Monday", startTime: "09:00", endTime: "17:00" },
    { _id: "b2", day: "Tuesday", startTime: "13:00", endTime: "17:00" },
    { _id: "b3", day: "Tuesday", startTime: "09:00", endTime: "12:00" },
    { _id: "b4", day: "Thursday", startTime: "09:00", endTime: "17:00" },
    { _id: "b5", day: "Friday", startTime: "09:00", endTime: "15:00" },
    { _id: "b6", day: "Saturday", startTime: "09:00", endTime: "12:00" },
  ],
  exceptions: [
    { _id: "e1", date: "2027-01-15T00:00:00.000Z", reason: "Dental conference" },
  ],
});

// GET answers with `schedule` (or 404 when it's null); PATCH records the body and saves it.
async function fakeSchedule(page, schedule, { failSave } = {}) {
  const patches = [];
  let current = schedule;
  await page.route("**/api/schedules/*", (route) => {
    const request = route.request();
    if (request.method() === "PATCH") {
      const body = request.postDataJSON();
      patches.push(body);
      if (failSave) {
        return route.fulfill({ status: 400, json: { status: "fail", message: failSave } });
      }
      current = {
        _id: "sch1",
        doctor: "d1",
        weeklyAvailability: body.weeklyAvailability,
        exceptions: body.exceptions.map((ex) => ({ ...ex, date: `${ex.date}T00:00:00.000Z` })),
      };
      return route.fulfill({ json: { status: "success", data: { schedule: current } } });
    }
    if (!current) {
      return route.fulfill({ status: 404, json: { status: "fail", message: "Doctor Schedule still not available..." } });
    }
    return route.fulfill({ json: { status: "success", data: { schedule: current } } });
  });
  return patches;
}

// one weekday's row in the Weekly hours list
const dayRow = (page, day) =>
  page.getByRole("main").getByRole("listitem").filter({ has: page.getByRole("heading", { name: day, exact: true }) });

const saveButton = (page) => page.getByRole("button", { name: "Save schedule" });

test.describe("Doctor schedule (desktop)", () => {
  test("shows the weekly hours in 12-hour time and the days off", async ({ page }) => {
    await fakeSchedule(page, SCHEDULE());
    await login(page, DOCTOR);
    await page.goto("/doctor/schedule");

    await expect(page.getByRole("heading", { level: 1, name: "Schedule" })).toBeVisible();
    // blocks are sorted by start time, whatever order the server sends
    await expect(dayRow(page, "Tuesday")).toContainText("9:00 AM – 12:00 PM1:00 – 5:00 PM");
    await expect(page.getByRole("button", { name: "Tuesday working" })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("button", { name: "Wednesday working" })).toHaveAttribute("aria-pressed", "false");
    await expect(page.getByRole("button", { name: "Wednesday working" })).toHaveText("Off");

    await expect(page.getByText("Fri, Jan 15, 2027")).toBeVisible();
    await expect(page.getByText("Dental conference")).toBeVisible();
    // nothing changed yet, so nothing to save
    await expect(saveButton(page)).toBeDisabled();
  });

  test("toggle, remove and add hours, then save the whole schedule", async ({ page }) => {
    const patches = await fakeSchedule(page, SCHEDULE());
    await login(page, DOCTOR);
    await page.goto("/doctor/schedule");

    // Off -> Working starts with 9 to 5
    await page.getByRole("button", { name: "Wednesday working" }).click();
    await expect(dayRow(page, "Wednesday")).toContainText("9:00 AM – 5:00 PM");
    // Working -> Off clears the day
    await page.getByRole("button", { name: "Saturday working" }).click();
    await expect(dayRow(page, "Saturday")).not.toContainText("AM");
    // remove one block
    await dayRow(page, "Tuesday").getByRole("button", { name: "Remove 1:00 – 5:00 PM" }).click();
    // add one block
    const friday = dayRow(page, "Friday");
    await friday.getByRole("button", { name: "+ Add hours" }).click();
    await friday.getByLabel("Start").fill("16:00");
    await friday.getByLabel("End").fill("18:00");
    await friday.getByRole("button", { name: "Add", exact: true }).click();
    await expect(friday).toContainText("4:00 – 6:00 PM");

    await saveButton(page).click();
    await expect(page.getByText("Schedule saved.")).toBeVisible();
    await expect(saveButton(page)).toBeDisabled();

    expect(patches).toEqual([
      {
        weeklyAvailability: [
          { day: "Monday", startTime: "09:00", endTime: "17:00" },
          { day: "Tuesday", startTime: "09:00", endTime: "12:00" },
          { day: "Wednesday", startTime: "09:00", endTime: "17:00" },
          { day: "Thursday", startTime: "09:00", endTime: "17:00" },
          { day: "Friday", startTime: "09:00", endTime: "15:00" },
          { day: "Friday", startTime: "16:00", endTime: "18:00" },
        ],
        exceptions: [{ date: "2027-01-15", reason: "Dental conference" }],
      },
    ]);
  });

  test("new hours are checked before they're added", async ({ page }) => {
    await fakeSchedule(page, SCHEDULE());
    await login(page, DOCTOR);
    await page.goto("/doctor/schedule");

    const monday = dayRow(page, "Monday");
    await monday.getByRole("button", { name: "+ Add hours" }).click();
    const add = monday.getByRole("button", { name: "Add", exact: true });

    await add.click();
    await expect(monday.getByRole("alert")).toHaveText("Enter a start and an end time.");

    await monday.getByLabel("Start").fill("10:00");
    await monday.getByLabel("End").fill("09:00");
    await add.click();
    await expect(monday.getByRole("alert")).toHaveText("End time must be after start time.");

    await monday.getByLabel("End").fill("18:00");
    await add.click();
    await expect(monday.getByRole("alert")).toHaveText("Overlaps 9:00 AM – 5:00 PM.");

    // nothing was added, and Cancel closes the editor
    await monday.getByRole("button", { name: "Cancel" }).click();
    await expect(monday.getByLabel("Start")).toHaveCount(0);
    await expect(saveButton(page)).toBeDisabled();
  });

  test("days off: add, refuse a duplicate, remove, then save", async ({ page }) => {
    const patches = await fakeSchedule(page, SCHEDULE());
    await login(page, DOCTOR);
    await page.goto("/doctor/schedule");

    const add = page.getByRole("button", { name: "Add day off" });
    await add.click();
    await expect(page.getByText("Pick a date.")).toBeVisible();

    await page.getByLabel("Date").fill("2027-03-10");
    await page.getByLabel("Reason (optional)").fill("  Training  ");
    await add.click();
    await expect(page.getByText("Wed, Mar 10, 2027")).toBeVisible();
    await expect(page.getByText("Training", { exact: true })).toBeVisible();
    // the form is cleared for the next one
    await expect(page.getByLabel("Date")).toHaveValue("");

    await page.getByLabel("Date").fill("2027-01-15");
    await add.click();
    await expect(page.getByText("That day is already off.")).toBeVisible();

    await page.getByRole("button", { name: "Remove Fri, Jan 15, 2027" }).click();
    await expect(page.getByText("Dental conference")).toHaveCount(0);

    await saveButton(page).click();
    await expect(page.getByText("Schedule saved.")).toBeVisible();
    expect(patches[0].exceptions).toEqual([{ date: "2027-03-10", reason: "Training" }]);
  });

  test("a doctor with no schedule yet starts from an empty week", async ({ page }) => {
    const patches = await fakeSchedule(page, null);
    await login(page, DOCTOR);
    await page.goto("/doctor/schedule");

    for (const day of ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]) {
      await expect(page.getByRole("button", { name: `${day} working` })).toHaveText("Off");
    }
    await expect(page.getByText("No days off planned.")).toBeVisible();
    await expect(page.getByText(/couldn't load/)).toHaveCount(0);

    await page.getByRole("button", { name: "Monday working" }).click();
    await saveButton(page).click();
    await expect(page.getByText("Schedule saved.")).toBeVisible();
    expect(patches).toEqual([
      { weeklyAvailability: [{ day: "Monday", startTime: "09:00", endTime: "17:00" }], exceptions: [] },
    ]);
  });

  test("a rejected save shows the server's message and keeps the edits", async ({ page }) => {
    const message = "Invalid input data. Tuesday: 09:00-12:00 overlaps 11:00-13:00";
    await fakeSchedule(page, SCHEDULE(), { failSave: message });
    await login(page, DOCTOR);
    await page.goto("/doctor/schedule");

    await page.getByRole("button", { name: "Wednesday working" }).click();
    await saveButton(page).click();

    await expect(page.getByRole("alert")).toHaveText(message);
    await expect(dayRow(page, "Wednesday")).toContainText("9:00 AM – 5:00 PM");
    await expect(saveButton(page)).toBeEnabled();
  });
});

test.describe("Doctor schedule on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("one Save button at the bottom, and the page fits", async ({ page }) => {
    await fakeSchedule(page, SCHEDULE());
    await login(page, DOCTOR);
    await page.goto("/doctor/schedule");

    await expect(page.getByRole("heading", { name: "Weekly hours" })).toBeVisible();
    // only one Save is visible: the bottom one, below Days off
    await expect(saveButton(page)).toHaveCount(1);
    const save = await saveButton(page).boundingBox();
    const addDayOff = await page.getByRole("button", { name: "Add day off" }).boundingBox();
    expect(save.y).toBeGreaterThan(addDayOff.y);

    const width = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(width).toBeLessThanOrEqual(390);
  });
});
