// Takes the README screenshots (docs/screenshots). Read-only: it logs in and opens pages.
// Run with the app running:  npm run screenshots              (dev: http://localhost:5173)
//                       or:  npm run screenshots -- <url>     (e.g. the live site)
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const base = process.argv[2] ?? "http://localhost:5173";
const outDir = fileURLToPath(new URL("../../docs/screenshots/", import.meta.url));
const PASSWORD = "Demo1234!";
const DESKTOP = { width: 1280, height: 800 };
const PHONE = { width: 390, height: 844 };

// [file, viewport, login email (or null), page, something to wait for]
const SHOTS = [
  ["home", DESKTOP, null, "/", "heading"],
  ["services", DESKTOP, null, "/services", "img"],
  ["doctors", DESKTOP, null, "/doctors", "img"],
  ["booking", DESKTOP, null, "/book", "heading"],
  ["patient-appointments", DESKTOP, "elena.reyes@example.com", "/account/appointments", "heading"],
  ["doctor-schedule", DESKTOP, "mei.chen@toothfairy.example", "/doctor/schedule", "heading"],
  ["admin-appointments", DESKTOP, "admin@toothfairy.example", "/admin/appointments", "table"],
  ["admin-services", DESKTOP, "admin@toothfairy.example", "/admin/services", "table"],
  ["home-phone", PHONE, null, "/", "heading"],
  ["booking-phone", PHONE, null, "/book", "heading"],
];

await mkdir(outDir, { recursive: true });
const browser = await chromium.launch();

for (const [name, viewport, email, path, waitFor] of SHOTS) {
  const page = await browser.newPage({ viewport });
  if (email) {
    await page.goto(`${base}/login`);
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: "Log in", exact: true }).click();
    await page.waitForURL((url) => !url.pathname.startsWith("/login"));
  }
  await page.goto(base + path);
  await page.locator(waitFor === "heading" ? "h1" : `main ${waitFor}`).first().waitFor();
  await page.waitForLoadState("networkidle"); // images and data have arrived
  await page.screenshot({ path: `${outDir}${name}.png` });
  console.log(`saved docs/screenshots/${name}.png`);
  await page.close();
}

await browser.close();
