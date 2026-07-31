import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = process.env.REPAIR_PAGE_URL ?? "http://127.0.0.1:4321/remont-i-restavratsiya-pechey/";
const artifactsDir = path.resolve("artifacts");
const executableCandidates = [
  process.env.CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
].filter(Boolean);
const executablePath = executableCandidates.find((candidate) => fs.existsSync(candidate));

fs.mkdirSync(artifactsDir, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  ...(executablePath ? { executablePath } : {}),
});

const variants = [
  { name: "desktop", viewport: { width: 1440, height: 900 }, isMobile: false },
  { name: "mobile", viewport: { width: 390, height: 844 }, isMobile: true },
];

const reports = [];

for (const variant of variants) {
  const context = await browser.newContext({
    viewport: variant.viewport,
    isMobile: variant.isMobile,
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const failedResponses = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      const location = message.location();
      consoleErrors.push(location.url ? `${message.text()} (${location.url}:${location.lineNumber})` : message.text());
    }
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 400) failedResponses.push(`${response.status()} ${response.url()}`);
  });

  const response = await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.evaluate(async () => {
    const step = Math.max(window.innerHeight * 0.8, 500);
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(250);
  const metrics = await page.evaluate(() => {
    const root = document.documentElement;
    const labels = Array.from(document.querySelectorAll(".before-after__stage")).map((node) => node.textContent?.trim());
    const services = Array.from(document.querySelectorAll('input[name="quiz_service"]')).map((input) => input.value);

    return {
      title: document.title,
      h1: Array.from(document.querySelectorAll("h1")).map((node) => node.textContent?.replace(/\s+/g, " ").trim()),
      sections: document.querySelectorAll("main > section").length,
      caseCards: document.querySelectorAll(".before-after__case").length,
      beforeLabels: labels.filter((label) => label === "До").length,
      afterLabels: labels.filter((label) => label === "После").length,
      missingAlt: Array.from(document.images).filter((image) => !image.hasAttribute("alt")).length,
      horizontalOverflow: root.scrollWidth - root.clientWidth,
      services,
    };
  });

  await page.screenshot({
    path: path.join(artifactsDir, `repair-restoration-${variant.name}.png`),
    fullPage: true,
  });

  reports.push({
    variant: variant.name,
    status: response?.status() ?? null,
    consoleErrors,
    pageErrors,
    failedResponses,
    ...metrics,
  });

  await context.close();
}

await browser.close();

const failures = reports.flatMap((report) => {
  const issues = [];
  if (report.status !== 200) issues.push(`HTTP ${report.status}`);
  if (report.h1.length !== 1) issues.push(`expected one H1, got ${report.h1.length}`);
  if (report.sections < 10) issues.push(`expected at least 10 sections, got ${report.sections}`);
  if (report.caseCards < 2) issues.push(`expected at least two case cards, got ${report.caseCards}`);
  if (report.beforeLabels !== report.afterLabels || report.beforeLabels < 2) issues.push("before/after labels are incomplete");
  if (report.missingAlt > 0) issues.push(`${report.missingAlt} images without alt`);
  if (report.horizontalOverflow > 1) issues.push(`horizontal overflow: ${report.horizontalOverflow}px`);
  if (report.consoleErrors.length > 0) issues.push(`${report.consoleErrors.length} console errors`);
  if (report.pageErrors.length > 0) issues.push(`${report.pageErrors.length} page errors`);
  if (report.failedResponses.length > 0) issues.push(`${report.failedResponses.length} failed responses`);
  if (!report.services.every((service) => service === "Ремонт и реставрация печи")) issues.push("wrong service value in a lead form");
  return issues.map((issue) => `${report.variant}: ${issue}`);
});

console.log(JSON.stringify({ reports, failures }, null, 2));
if (failures.length > 0) process.exitCode = 1;
