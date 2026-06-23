import { chromium } from "playwright";
import { writeFileSync } from "fs";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  userAgent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
});

await page.goto("https://min-repo.com/3177331/", { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForTimeout(2000);
await page.click('a[href*="kishu=all"]');
await page.waitForLoadState("domcontentloaded");
await page.waitForTimeout(3000);

writeFileSync("scripts/minrepo-all-click.html", await page.content(), "utf8");
console.log("url", page.url());
console.log("title", await page.title());

const tables = await page.$$eval("table", (tables) =>
  tables.map((t) => ({
    className: t.className,
    headers: Array.from(t.querySelectorAll("th")).map((th) => th.textContent?.trim()),
    rows: t.querySelectorAll("tr").length,
  }))
);
console.log(JSON.stringify(tables.filter((t) => t.headers.length), null, 2));

const sample = await page.$$eval("table tr", (rows) =>
  rows
    .slice(0, 5)
    .map((r) => Array.from(r.querySelectorAll("td,th")).map((c) => c.textContent?.trim()))
);
console.log("sample rows", sample);

await browser.close();
