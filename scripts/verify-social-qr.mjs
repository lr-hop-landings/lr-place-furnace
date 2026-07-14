import { readFile } from "node:fs/promises";

const componentPath = new URL("../src/components/contacts/social-links-cards-01.astro", import.meta.url);
const pagePath = new URL("../src/pages/index.astro", import.meta.url);

const [component, page] = await Promise.all([
  readFile(componentPath, "utf8"),
  readFile(pagePath, "utf8"),
]);

const checks = [
  [
    "typed QR-strip variant",
    component.includes('variant?: "cards" | "qr-strip"'),
  ],
  [
    "typed optional QR visibility prop",
    component.includes("showQr?: boolean"),
  ],
  [
    "QR visibility defaults to enabled",
    component.includes("showQr = true"),
  ],
  [
    "QR-strip section modifier",
    component.includes("social-links-cards--qr-strip"),
  ],
  [
    "dedicated QR-strip button",
    component.includes("social-links-cards__strip-button"),
  ],
  [
    "dedicated QR link",
    component.includes("social-links-cards__strip-qr-link"),
  ],
  [
    "mobile QR link is hidden below 768px",
    /@media\s*\(max-width:\s*767px\)[\s\S]*?social-links-cards__strip-qr-link[\s\S]*?display:\s*none/.test(component),
  ],
  [
    "Block2 activates QR-strip variant",
    /<Block2\s+\{\.\.\.blockProps\[1\]\}\s+variant="qr-strip"\s*\/>/.test(page),
  ],
  [
    "Block11 reuses QR-strip with QR disabled",
    /<Block11\s+\{\.\.\.blockProps\[7\]\}\s+variant="qr-strip"\s+showQr=\{false\}\s*\/>/.test(page),
  ],
  [
    "QR markup respects visibility prop",
    /\{showQr\s*&&\s*item\.qrSrc\s*&&\s*\(/.test(component),
  ],
  [
    "current QR assets remain in page data",
    ["/qr/vk.svg", "/qr/telegram.svg", "/qr/max.svg"].every((value) => page.includes(value)),
  ],
  [
    "current social links remain in page data",
    ["https://vk.com/lenremont", "https://t.me/lenremont", "https://max.ru/id471902475874_3_bot"].every((value) => page.includes(value)),
  ],
];

const failed = checks.filter(([, passed]) => !passed);

for (const [name, passed] of checks) {
  console.log(`${passed ? "PASS" : "FAIL"} ${name}`);
}

if (failed.length > 0) {
  console.error(`\nSocial QR verification failed: ${failed.length} check(s).`);
  process.exit(1);
}

console.log("\nSocial QR verification passed.");
