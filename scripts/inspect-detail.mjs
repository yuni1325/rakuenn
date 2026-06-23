import { chromium } from "playwright";
import { writeFileSync } from "fs";

const LIST_URL =
  "https://ana-slo.com/ホールデータ/千葉県/楽園柏店-データ一覧/";
const DETAIL_URL =
  "https://ana-slo.com/2026-06-17-%e6%a5%bd%e5%9c%92%e6%9f%8f%e5%ba%97-data/";

const browser = await chromium.launch({
  headless: true,
  args: ["--disable-blink-features=AutomationControlled"],
});
const context = await browser.newContext({
  userAgent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  locale: "ja-JP",
});
const page = await context.newPage();

async function passCloudflare(url) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90000 });
  try {
    await page.waitForFunction(() => !document.title.includes("Just a moment"), {
      timeout: 60000,
    });
  } catch {
    await page.waitForTimeout(15000);
  }
  await page.waitForTimeout(2000);
  // データテーブル読み込み待ち
  try {
    await page.waitForSelector(".table-row, table tr, .kisyu-table", { timeout: 30000 });
  } catch {
    console.log("No table selector found, waiting more...");
    await page.waitForTimeout(10000);
  }
}

await passCloudflare(LIST_URL);
console.log("List loaded:", await page.title());

await passCloudflare(DETAIL_URL);
console.log("Detail loaded:", await page.title());
console.log("Body text length:", (await page.innerText("body")).length);

const html = await page.content();
writeFileSync("scripts/detail-page.html", html, "utf8");

const tables = await page.$$eval("table", (tables) =>
  tables.map((t, i) => ({
    index: i,
    className: t.className,
    id: t.id,
    rowCount: t.querySelectorAll("tr").length,
    headers: Array.from(t.querySelectorAll("th")).map((th) => th.textContent?.trim()),
    sampleRows: Array.from(t.querySelectorAll("tr"))
      .slice(0, 3)
      .map((tr) =>
        Array.from(tr.querySelectorAll("td, th")).map((c) => c.textContent?.trim())
      ),
  }))
);
const divTables = await page.$$eval(".table-row", (rows) =>
  rows.slice(0, 5).map((r) =>
    Array.from(r.querySelectorAll(".table-header-cell, .table-data-cell, div")).map(
      (c) => c.textContent?.trim()
    )
  )
);
console.log("Div rows sample:", JSON.stringify(divTables, null, 2));

await browser.close();
