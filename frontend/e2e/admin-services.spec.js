import { test, expect } from "@playwright/test";
import { login, ADMIN, parseMultipart } from "./helpers";

// Fake catalog: creating, editing or deleting real services would change what patients can book.

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);
const TAKEN = "This name is already in use. Please use a different one.";

const service = (id, fields) => ({
  _id: id,
  id,
  slug: id,
  imageCover: "default.jpg",
  secretService: false,
  active: true,
  ...fields,
});

async function fakeServices(page) {
  const services = new Map(
    [
      service("s1", { name: "Teeth Cleaning", category: "Preventive & Diagnostic", price: 80, duration: 45, summary: "A cleaning." }),
      service("s2", { name: "Teeth Whitening", category: "Cosmetic", price: 300, priceDiscount: 250, duration: 90, summary: "Whiter teeth." }),
      service("s3", { name: "Sedation Consult", slug: "sedation-consult", category: "Consultation", price: 90, duration: 30, summary: "Talk it over.", secretService: true }),
      service("s4", { name: "Gum Contouring", category: "Cosmetic", price: 400, duration: 60, summary: "Reshape gums.", active: false }),
    ].map((s) => [s._id, s]),
  );
  const calls = [];

  await page.route(/\/api\/services(\/.*)?$/, (route) => {
    const request = route.request();
    const method = request.method();
    const path = new URL(request.url()).pathname.replace(/^\/api\/services/, "");
    const ok = (json, status = 200) => route.fulfill({ status, json: { status: "success", ...json } });

    if (method === "GET" && path === "/admin") return ok({ data: { services: [...services.values()] } });
    if (method === "GET" && path.startsWith("/admin/")) return ok({ data: { service: services.get(path.split("/").pop()) } });
    if (method === "PATCH" && path.startsWith("/admin/restore/")) {
      const id = path.split("/").pop();
      calls.push({ method: "RESTORE", id });
      services.get(id).active = true;
      return ok({ data: { service: services.get(id) } });
    }
    if (method === "DELETE") {
      const id = path.slice(1);
      calls.push({ method: "DELETE", id });
      services.get(id).active = false;
      return route.fulfill({ status: 204, body: "" });
    }
    if (method === "POST" || method === "PATCH") {
      const fields = parseMultipart(request.postDataBuffer().toString("latin1"));
      calls.push({ method, id: path.slice(1) || undefined, fields });
      if (method === "POST" && fields.name === "Teeth Cleaning") {
        return route.fulfill({ status: 409, json: { status: "fail", message: TAKEN } });
      }
      return ok({ data: { service: {} } }, method === "POST" ? 201 : 200);
    }
    return route.fallback();
  });
  return calls;
}

const bodyRows = (page) => page.getByRole("main").locator("tbody tr");
const row = (page, name) => bodyRows(page).filter({ hasText: name });

test.describe("Admin services (desktop)", () => {
  test("lists the whole catalog with price, visibility and status", async ({ page }) => {
    await fakeServices(page);
    await login(page, ADMIN);
    await page.goto("/admin/services");

    await expect(page.getByRole("heading", { level: 1, name: "Services" })).toBeVisible();
    // active ones by name, then deleted
    await expect(bodyRows(page).locator("td:first-child")).toHaveText(["Sedation Consult", "Teeth Cleaning", "Teeth Whitening", "Gum Contouring"]);
    await expect(row(page, "Teeth Whitening")).toContainText("$250 (was $300)");
    await expect(row(page, "Sedation Consult")).toContainText("Unlisted");
    await expect(row(page, "Gum Contouring")).toContainText("Deleted");
    await expect(page.getByRole("button", { name: "Restore Gum Contouring" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Delete Gum Contouring" })).toHaveCount(0);
  });

  test("delete asks first; restore brings a service back", async ({ page }) => {
    const calls = await fakeServices(page);
    await login(page, ADMIN);
    await page.goto("/admin/services");
    const dialog = page.getByRole("alertdialog");

    await page.getByRole("button", { name: "Delete Teeth Cleaning" }).click();
    await expect(dialog.getByRole("heading")).toHaveText("Delete Teeth Cleaning?");
    await dialog.getByRole("button", { name: "Delete" }).click();
    await expect(dialog).toBeHidden();
    await expect(row(page, "Teeth Cleaning")).toContainText("Deleted");

    await page.getByRole("button", { name: "Restore Gum Contouring" }).click();
    await expect(row(page, "Gum Contouring")).toContainText("Active");
    expect(calls).toEqual([
      { method: "DELETE", id: "s1" },
      { method: "RESTORE", id: "s4" },
    ]);
  });

  test("an unlisted service has Copy link, which copies its page address", async ({ page }) => {
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await fakeServices(page);
    await login(page, ADMIN);
    await page.goto("/admin/services");

    // only unlisted services get it: public ones are in the catalog anyway
    await expect(page.getByRole("button", { name: /^Copy link/ })).toHaveCount(1);
    await page.getByRole("button", { name: "Copy link to Sedation Consult" }).click();

    const url = "http://localhost:5173/services/sedation-consult";
    await expect(page.getByRole("status")).toHaveText(`Link copied: ${url}`);
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(url);
  });

  test("a new service is checked, then created with its cover and visibility", async ({ page }) => {
    const calls = await fakeServices(page);
    await login(page, ADMIN);
    await page.goto("/admin/services");

    await page.getByRole("link", { name: "+ New service" }).click();
    await expect(page).toHaveURL("/admin/services/new");
    await expect(page.getByRole("heading", { level: 1, name: "New service" })).toBeVisible();

    const create = page.getByRole("button", { name: "Create service" });
    await create.click();
    for (const message of ["Enter a name.", "Choose a category.", "Enter a summary.", "Enter a price.", "Enter 1–480 minutes."]) {
      await expect(page.getByText(message)).toBeVisible();
    }

    await page.getByLabel("Name").fill("Gum Graft");
    await page.getByLabel("Category").selectOption("Surgical & Specialized");
    await page.getByLabel("Summary").fill("Rebuilds receding gums.");
    await page.getByLabel("Price ($)").fill("250");
    await page.getByLabel("Sale price ($, optional)").fill("300");
    await page.getByLabel("Duration (min)").fill("90");
    await create.click();
    await expect(page.getByText("Sale price must be lower than the regular price.")).toBeVisible();
    expect(calls).toEqual([]);

    await page.getByLabel("Sale price ($, optional)").fill("200");
    await page.getByRole("switch", { name: "Unlisted" }).click();
    await expect(page.getByRole("switch", { name: "Unlisted" })).toHaveAttribute("aria-checked", "true");
    await page.locator('input[type="file"]').setInputFiles({ name: "cover.png", mimeType: "image/png", buffer: PNG });
    await expect(page.getByRole("main").locator("img")).toHaveAttribute("src", /^blob:/);
    await create.click();

    await expect(page).toHaveURL("/admin/services");
    expect(calls).toEqual([
      {
        method: "POST",
        id: undefined,
        fields: {
          name: "Gum Graft",
          category: "Surgical & Specialized",
          summary: "Rebuilds receding gums.",
          price: "250",
          priceDiscount: "200",
          duration: "90",
          secretService: "true",
          imageCover: { filename: "cover.png" },
        },
      },
    ]);
  });

  test("editing starts from the saved service, and clearing the sale price sends it empty", async ({ page }) => {
    const calls = await fakeServices(page);
    await login(page, ADMIN);
    await page.goto("/admin/services");

    await page.getByRole("link", { name: "Edit Teeth Whitening" }).click();
    await expect(page).toHaveURL("/admin/services/s2/edit");
    await expect(page.getByRole("heading", { level: 1, name: "Edit service" })).toBeVisible();
    await expect(page.getByLabel("Name")).toHaveValue("Teeth Whitening");
    await expect(page.getByLabel("Category")).toHaveValue("Cosmetic");
    await expect(page.getByLabel("Sale price ($, optional)")).toHaveValue("250");

    await page.getByLabel("Sale price ($, optional)").fill("");
    await page.getByRole("button", { name: "Save changes" }).click();

    await expect(page).toHaveURL("/admin/services");
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({ method: "PATCH", id: "s2", fields: { name: "Teeth Whitening", priceDiscount: "", price: "300" } });
  });

  test("a server error shows inline and keeps the form", async ({ page }) => {
    await fakeServices(page);
    await login(page, ADMIN);
    await page.goto("/admin/services/new");

    await page.getByLabel("Name").fill("Teeth Cleaning");
    await page.getByLabel("Category").selectOption("Cosmetic");
    await page.getByLabel("Summary").fill("Again.");
    await page.getByLabel("Price ($)").fill("80");
    await page.getByLabel("Duration (min)").fill("45");
    await page.getByRole("button", { name: "Create service" }).click();

    await expect(page.getByRole("alert")).toHaveText(TAKEN);
    await expect(page).toHaveURL("/admin/services/new");
    await expect(page.getByLabel("Name")).toHaveValue("Teeth Cleaning");
  });
});

test.describe("Admin services on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("cards with actions, a short New button, and the pages fit", async ({ page }) => {
    await fakeServices(page);
    await login(page, ADMIN);
    await page.goto("/admin/services");

    await expect(page.getByRole("link", { name: "+ New", exact: true })).toBeVisible();
    const card = page.getByRole("main").getByRole("listitem").filter({ hasText: "Teeth Whitening" });
    await expect(card).toContainText("$250 (was $300) · 90 min · Public");
    await expect(card.getByRole("link", { name: "Edit Teeth Whitening" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);

    await page.getByRole("link", { name: "+ New", exact: true }).click();
    await expect(page.getByRole("button", { name: "Create service" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  });
});
