import { test, expect } from "@playwright/test";

// An unlisted service isn't in the public list, but its shared link must still lead to a booking.

test("the public service endpoint finds a service by id as well as by slug", async ({ request }) => {
  const list = await (await request.get("/api/services")).json();
  const first = list.data.services[0];

  const byId = await request.get(`/api/services/${first.id}`);
  const bySlug = await request.get(`/api/services/${first.slug}`);
  expect(byId.status()).toBe(200);
  expect(bySlug.status()).toBe(200);
  expect((await byId.json()).data.service.name).toBe(first.name);
  expect((await bySlug.json()).data.service.name).toBe(first.name);

  const unknown = await request.get("/api/services/aaaaaaaaaaaaaaaaaaaaaaaa");
  expect(unknown.status()).toBe(404);
});

test.describe("Booking an unlisted service from its link", () => {
  const UNLISTED = {
    _id: "6aaaaaaaaaaaaaaaaaaaaaa1",
    id: "6aaaaaaaaaaaaaaaaaaaaaa1",
    name: "Sedation Consult",
    slug: "sedation-consult",
    category: "Consultation",
    summary: "Talk through sedation options.",
    price: 90,
    duration: 30,
    imageCover: "default.jpg",
    secretService: true,
  };

  // the public list (real, without the unlisted one) plus the unlisted service by id or slug
  async function fakeUnlisted(page) {
    await page.route(/\/api\/services\/[^/?]+$/, (route) => {
      const key = new URL(route.request().url()).pathname.split("/").pop();
      if (key !== UNLISTED.id && key !== UNLISTED.slug) return route.fallback();
      return route.fulfill({ json: { status: "success", data: { service: UNLISTED } } });
    });
  }

  test("its page links to booking, and booking shows the service", async ({ page }) => {
    await fakeUnlisted(page);
    await page.goto("/services/sedation-consult");
    await expect(page.getByRole("heading", { level: 1, name: "Sedation Consult" })).toBeVisible();

    await page.getByRole("link", { name: "Book this service" }).click();
    await expect(page).toHaveURL(`/book?service=${UNLISTED.id}`);

    // step 2 (choose a dentist) with the unlisted service in the summary
    await expect(page.getByRole("main")).toContainText("Sedation Consult");
    // and it isn't offered in the public list of services
    const list = await (await page.request.get("/api/services")).json();
    expect(list.data.services.some((s) => s.name === "Sedation Consult")).toBe(false);
  });

  test("on a phone, the chosen-service bar shows its name and length", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await fakeUnlisted(page);
    await page.goto(`/book?service=${UNLISTED.id}`);
    await expect(page.getByText("Sedation Consult · 30 min")).toBeVisible();
  });
});
