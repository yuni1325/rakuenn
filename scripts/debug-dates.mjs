import { chromium } from "playwright";
import { writeFileSync } from "fs";

const dates = ["2026-06-15", "2026-06-16", "2026-06-17"];
const slug = "%e6%a5%bd%e5%9c%92%e6%9f%8f%e5%ba%97";

const browser = await chromium.launch({
  headless: false,
  args: ["--disable-blink-features=AutomationControlled"],
});
const page = await browser.newPage({
  userAgent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  locale: "ja-JP",
});

const listUrl = "https://ana-slo.com/ホールデータ/千葉県/楽園柏店-データ一覧/";
await page.goto(listUrl, { waitUntil: "domcontentloaded", timeout: 90000 });
await page.waitForFunction(() => !document.title.includes("Just a moment"), { timeout: 60000 });
await page.waitForTimeout(2000);

for (const date of dates) {
  const url = `https://ana-slo.com/${date}-${slug}-data/`;
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90000 });
  try {
    await page.waitForFunction(
      (titles) => !titles.some((t) => document.title.includes(t)),
      [["Just a moment", "しばらく", "セキュリティ"]],
      { timeout: 60000 }
    );
  } catch {
    await page.waitForTimeout(10000);
  }
  await page.waitForTimeout(2000);

  const title = await page.title();
  const hasTable = await page.$("#all_data_table");
  const rowCount = await page.$$eval("#all_data_table tbody tr", (r) => r.length).catch(() => 0);
  const bodyLen = (await page.innerText("body")).length;
  console.log({ date, title, hasTable: !!hasTable, rowCount, bodyLen, url });

  if (!hasTable) {
    writeFileSync(`scripts/debug-${date}.html`, await page.content(), "utf8");
  }
}

await browser.close();
