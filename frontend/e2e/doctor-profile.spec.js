import { test, expect } from "@playwright/test";
import { login, DOCTOR } from "./helpers";

// Saves are faked: a real save would change the seed doctor everyone sees on the public pages.

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

// "name" -> value for text fields, "photo" -> { filename } for the file
function parseMultipart(body) {
  const fields = {};
  const part = /name="([^"]+)"(; filename="([^"]*)")?\r\n(?:Content-Type: [^\r\n]*\r\n)?\r\n([\s\S]*?)\r\n--/g;
  for (const m of body.matchAll(part)) fields[m[1]] = m[2] ? { filename: m[3] } : m[4];
  return fields;
}

// PATCH /users/myAccount answers with the real user plus the sent fields; GET passes through.
async function fakeProfileSave(page, { fail } = {}) {
  const saves = [];
  await page.route("**/api/users/myAccount", async (route) => {
    const request = route.request();
    if (request.method() !== "PATCH") return route.continue();
    const fields = parseMultipart(request.postDataBuffer().toString("latin1"));
    saves.push(fields);
    if (fail) return route.fulfill({ status: 400, json: { status: "fail", message: fail } });
    const real = await page.request.get("/api/users/myAccount", {
      headers: { authorization: request.headers().authorization },
    });
    const me = (await real.json()).data.user;
    const user = {
      ...me,
      name: fields.name,
      specialization: fields.specialization,
      bio: fields.bio,
      yearsOfExperience: fields.yearsOfExperience === "" ? null : Number(fields.yearsOfExperience),
    };
    return route.fulfill({ json: { status: "success", data: { user } } });
  });
  return saves;
}

// the rating on the preview card
const fakeRating = (page) =>
  page.route("**/api/doctors/*", (route) =>
    route.fulfill({ json: { status: "success", data: { doctor: { ratingAverage: 4.9, ratingCount: 48 } } } }),
  );

const saveButton = (page) => page.getByRole("button", { name: "Save profile" });
const previewCard = (page) => page.getByRole("region", { name: "How patients see you" });

test.describe("Doctor profile (desktop)", () => {
  test("shows the saved profile, and the preview card follows the form", async ({ page }) => {
    await fakeRating(page);
    await login(page, DOCTOR);
    await page.goto("/doctor/profile");

    await expect(page.getByRole("heading", { level: 1, name: "Your public profile" })).toBeVisible();
    await expect(page.getByLabel("Full name")).toHaveValue("Dr. Mei Chen");
    await expect(saveButton(page)).toBeDisabled();
    await expect(previewCard(page)).toContainText("4.9 · 48 reviews");

    await page.getByLabel("Full name").fill("Dr. Mei Chen-Lee");
    await page.getByLabel("Specialization").fill("Pediatric Dentistry");
    await page.getByLabel("Years of experience").fill("15");
    await expect(previewCard(page).getByRole("heading", { name: "Dr. Mei Chen-Lee" })).toBeVisible();
    await expect(previewCard(page)).toContainText("Pediatric Dentistry · 15 yrs experience");
    await expect(saveButton(page)).toBeEnabled();
  });

  test("Save sends the trimmed profile, then the sidebar shows it", async ({ page }) => {
    await fakeRating(page);
    const saves = await fakeProfileSave(page);
    await login(page, DOCTOR);
    await page.goto("/doctor/profile");

    await page.getByLabel("Specialization").fill("  Pediatric Dentistry ");
    await page.getByLabel("Years of experience").fill("15");
    await page.getByLabel("Bio").fill("Gentle care for kids.");
    await expect(page.getByText("21 / 500")).toBeVisible();
    await saveButton(page).click();

    await expect(page.getByText("Profile saved.")).toBeVisible();
    await expect(saveButton(page)).toBeDisabled();
    expect(saves).toEqual([
      { name: "Dr. Mei Chen", specialization: "Pediatric Dentistry", yearsOfExperience: "15", bio: "Gentle care for kids." },
    ]);
    await expect(page.getByRole("complementary")).toContainText("Pediatric Dentistry");
  });

  test("an empty name or impossible years stop the save", async ({ page }) => {
    const saves = await fakeProfileSave(page);
    await login(page, DOCTOR);
    await page.goto("/doctor/profile");

    await page.getByLabel("Full name").fill("");
    await page.getByLabel("Years of experience").fill("80");
    await saveButton(page).click();

    await expect(page.getByText("Enter your name.")).toBeVisible();
    await expect(page.getByText("Enter a whole number from 0 to 70.")).toBeVisible();
    expect(saves).toEqual([]);
  });

  test("the bio stops at 500 characters", async ({ page }) => {
    await login(page, DOCTOR);
    await page.goto("/doctor/profile");

    await page.getByLabel("Bio").fill("a".repeat(510));
    await expect(page.getByLabel("Bio")).toHaveValue("a".repeat(500));
    await expect(page.getByText("500 / 500")).toBeVisible();
  });

  test("a new photo shows in the form and the preview, and is sent", async ({ page }) => {
    await fakeRating(page);
    const saves = await fakeProfileSave(page);
    await login(page, DOCTOR);
    await page.goto("/doctor/profile");

    await page.locator('input[type="file"]').setInputFiles({ name: "face.png", mimeType: "image/png", buffer: PNG });
    await expect(previewCard(page).locator("img")).toHaveAttribute("src", /^blob:/);
    await saveButton(page).click();

    await expect(page.getByText("Profile saved.")).toBeVisible();
    expect(saves[0].photo).toEqual({ filename: "face.png" });
  });

  test("a rejected save shows the server's message and keeps the edits", async ({ page }) => {
    const message = "Invalid input data. A bio must have less or equal than 500 characters...";
    await fakeProfileSave(page, { fail: message });
    await login(page, DOCTOR);
    await page.goto("/doctor/profile");

    await page.getByLabel("Specialization").fill("Pediatric Dentistry");
    await saveButton(page).click();

    await expect(page.getByRole("alert")).toHaveText(message);
    await expect(page.getByLabel("Specialization")).toHaveValue("Pediatric Dentistry");
    await expect(saveButton(page)).toBeEnabled();
  });
});

test.describe("Doctor profile on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("the form fits, without the preview card", async ({ page }) => {
    await login(page, DOCTOR);
    await page.goto("/doctor/profile");

    await expect(page.getByRole("heading", { name: "Your public profile" })).toBeVisible();
    await expect(previewCard(page)).toBeHidden();
    await expect(saveButton(page)).toBeVisible();

    const width = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(width).toBeLessThanOrEqual(390);
  });
});
