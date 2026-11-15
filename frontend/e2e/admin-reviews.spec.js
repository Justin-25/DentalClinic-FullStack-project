import { test, expect } from "@playwright/test";
import { login, ADMIN } from "./helpers";

// Fake reviews: removing is permanent on the real server.

const MEI = { _id: "d1", id: "d1", name: "Dr. Mei Chen" };
const ANA = { _id: "d2", id: "d2", name: "Dr. Ana Santos" };
const PATIENTS = ["Elena Reyes", "Carlos Mendoza", "Marco Diaz", "Sam"];

// 23 reviews; every 3rd is about the clinic, the rest alternate between two dentists
const REVIEWS = Array.from({ length: 23 }, (_, k) => {
  const i = k + 1;
  const clinic = i % 3 === 0;
  return {
    _id: `r${i}`,
    review: `Review number ${i}`,
    rating: (i % 5) + 1,
    type: clinic ? "clinic" : "doctor",
    doctor: clinic ? undefined : i % 2 ? { _id: MEI._id, name: MEI.name } : { _id: ANA._id, name: ANA.name },
    patient: { _id: `p${i}`, name: PATIENTS[i % PATIENTS.length] },
    createdAt: `2026-10-${String(i).padStart(2, "0")}T10:00:00.000Z`,
  };
});

async function fakeReviews(page) {
  let reviews = [...REVIEWS];
  const deleted = [];
  await page.route(/\/api\/reviews(\/[^/?]+)?(\?.*)?$/, (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (request.method() === "DELETE") {
      const id = url.pathname.split("/").pop();
      deleted.push(id);
      reviews = reviews.filter((r) => r._id !== id);
      return route.fulfill({ status: 204, body: "" });
    }
    if (url.pathname !== "/api/reviews") return route.fallback();
    const q = url.searchParams;
    const pageNo = Number(q.get("page") ?? 1);
    const limit = Number(q.get("limit") ?? 10);
    const list = reviews
      .filter((r) => !q.get("type") || r.type === q.get("type"))
      .filter((r) => !q.get("doctor") || r.doctor?._id === q.get("doctor"))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return route.fulfill({
      json: {
        status: "success",
        pagination: { page: pageNo, limit, totalResults: list.length, totalPages: Math.ceil(list.length / limit) },
        data: { reviews: list.slice((pageNo - 1) * limit, pageNo * limit) },
      },
    });
  });
  await page.route("**/api/doctors", (route) =>
    route.fulfill({ json: { status: "success", results: 2, data: { doctors: [MEI, ANA] } } }),
  );
  return deleted;
}

const bodyRows = (page) => page.getByRole("main").locator("tbody tr");

test.describe("Admin reviews (desktop)", () => {
  test("newest first, 10 per page, with author, subject and stars", async ({ page }) => {
    await fakeReviews(page);
    await login(page, ADMIN);
    await page.goto("/admin/reviews");

    await expect(page.getByRole("heading", { level: 1, name: "Reviews" })).toBeVisible();
    await expect(bodyRows(page)).toHaveCount(10);
    const first = bodyRows(page).first(); // review 23: Mei, by Sam, 4 stars
    await expect(first).toContainText("“Review number 23”");
    await expect(first).toContainText("Dr. Mei Chen");
    await expect(first).toContainText("Sam");
    await expect(first).toContainText("Oct 23");
    await expect(first.getByRole("img", { name: "4 out of 5 stars" })).toBeVisible();
    await expect(bodyRows(page).filter({ hasText: "Review number 21" })).toContainText("Clinic");
    await expect(bodyRows(page).filter({ hasText: "Review number 22" })).toContainText("Marco D.");
    await expect(page.getByText("Page 1 of 3 · 23 reviews")).toBeVisible();

    await page.getByRole("button", { name: "Next ›" }).click();
    await expect(page.getByText("Page 2 of 3 · 23 reviews")).toBeVisible();
    await expect(bodyRows(page).first()).toContainText("Review number 13");
  });

  test("filters by type and dentist", async ({ page }) => {
    await fakeReviews(page);
    await login(page, ADMIN);
    await page.goto("/admin/reviews");

    await page.getByRole("button", { name: "Clinic" }).click();
    await expect(page.getByText("Page 1 of 1 · 7 reviews")).toBeVisible();
    await expect(page.getByLabel("Dentist")).toBeDisabled();

    await page.getByRole("button", { name: "All" }).click();
    await page.getByLabel("Dentist").selectOption({ label: "Dr. Ana Santos" });
    await expect(page.getByText("Page 1 of 1 · 8 reviews")).toBeVisible();
    for (const r of await bodyRows(page).all()) await expect(r).toContainText("Dr. Ana Santos");
  });

  test("remove asks first, then the review is gone", async ({ page }) => {
    const deleted = await fakeReviews(page);
    await login(page, ADMIN);
    await page.goto("/admin/reviews");
    const dialog = page.getByRole("alertdialog");

    const target = bodyRows(page).filter({ hasText: "Review number 22" });
    await target.getByRole("button", { name: "Remove review by Marco D." }).click();
    await expect(dialog.getByRole("heading")).toHaveText("Remove this review?");
    await dialog.getByRole("button", { name: "Not now" }).click();
    expect(deleted).toEqual([]);

    await target.getByRole("button", { name: "Remove review by Marco D." }).click();
    await dialog.getByRole("button", { name: "Remove" }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByText("Review number 22")).toHaveCount(0);
    await expect(page.getByText("Page 1 of 3 · 22 reviews")).toBeVisible();
    expect(deleted).toEqual(["r22"]);
  });
});

test.describe("Admin reviews on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("cards with Remove, and the page fits", async ({ page }) => {
    await fakeReviews(page);
    await login(page, ADMIN);
    await page.goto("/admin/reviews");

    const card = page.getByRole("main").getByRole("listitem").first();
    await expect(card).toContainText("“Review number 23”");
    await expect(card).toContainText("Sam · Dr. Mei Chen");
    await expect(card.getByRole("button", { name: "Remove review by Sam" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  });
});
