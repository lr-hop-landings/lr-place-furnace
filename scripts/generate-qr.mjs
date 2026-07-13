import { mkdir, writeFile } from "node:fs/promises";
import QRCode from "qrcode";

const links = {
  vk: "https://vk.com/lenremont",
  telegram: "https://t.me/lenremont",
  max: "https://max.ru/id471902475874_3_bot",
};

await mkdir(new URL("../public/qr/", import.meta.url), { recursive: true });

for (const [name, url] of Object.entries(links)) {
  const svg = await QRCode.toString(url, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 2,
    color: { dark: "#0B1F33", light: "#FFFFFF" },
  });
  await writeFile(new URL(`../public/qr/${name}.svg`, import.meta.url), svg, "utf8");
}

console.log("QR assets generated for VK, Telegram and MAX.");
