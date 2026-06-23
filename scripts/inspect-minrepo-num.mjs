import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  userAgent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
});

await page.goto("https://min-repo.com/3177331/?num=292", {
  waitUntil: "domcontentloaded",
  timeout: 60000,
});
await page.waitForTimeout(3000);
console.log("title", await page.title());
const ths = await page.$$eval("th", (els) => els.map((e) => e.textContent?.trim()).filter(Boolean));
console.log("ths", ths);
const text = await page.innerText("body");
console.log(text.includes("BB"), text.includes("RB"));
console.log(text.slice(0, 1500));

await browser.close();
