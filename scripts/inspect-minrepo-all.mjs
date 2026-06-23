import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  userAgent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
});

await page.goto("https://min-repo.com/3177331/?kishu=all", {
  waitUntil: "domcontentloaded",
  timeout: 60000,
});
await page.waitForTimeout(3000);

const tables = await page.$$eval("table", (tables) =>
  tables.map((t, i) => ({
    i,
    className: t.className,
    headers: Array.from(t.querySelectorAll("th")).map((th) => th.textContent?.trim()),
    rowCount: t.querySelectorAll("tbody tr, tr").length,
    sampleRows: Array.from(t.querySelectorAll("tr"))
      .slice(0, 3)
      .map((tr) =>
        Array.from(tr.querySelectorAll("td, th")).map((c) => c.textContent?.trim().slice(0, 20))
      ),
  }))
);
console.log(JSON.stringify(tables.filter((t) => t.headers.length > 0).slice(0, 5), null, 2));

await browser.close();
