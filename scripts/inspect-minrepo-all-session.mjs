import { chromium } from "playwright";
import { writeFileSync } from "fs";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  userAgent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
});

await page.goto("https://min-repo.com/3177331/", { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForTimeout(2000);
await page.goto("https://min-repo.com/3177331/?kishu=all", {
  waitUntil: "domcontentloaded",
  timeout: 60000,
});
await page.waitForTimeout(4000);

writeFileSync("scripts/minrepo-all-session.html", await page.content(), "utf8");
console.log("title", await page.title(), "len", (await page.innerText("body")).length);

const tables = await page.$$eval("table", (tables) =>
  tables.map((t) => ({
    className: t.className,
    headers: Array.from(t.querySelectorAll("th")).map((th) => th.textContent?.trim()),
    rows: t.querySelectorAll("tr").length,
    sample: Array.from(t.querySelectorAll("tr")[1]?.querySelectorAll("td") || []).map((c) =>
      c.textContent?.trim()
    ),
  }))
);
console.log(JSON.stringify(tables.filter((t) => t.headers.some((h) => h?.includes("台"))), null, 2));

await browser.close();
