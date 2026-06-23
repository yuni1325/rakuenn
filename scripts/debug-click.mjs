import { chromium } from "playwright";

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
await page.waitForSelector(".date-table a", { timeout: 30000 });

for (const date of ["2026-06-15", "2026-06-16", "2026-06-17"]) {
  await page.goto(listUrl, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForSelector(`a[href*="${date}"]`, { timeout: 30000 });
  const link = await page.$(`a[href*="${date}"]`);
  const href = await link?.getAttribute("href");
  await link?.click();
  await page.waitForLoadState("domcontentloaded");
  try {
    await page.waitForFunction(
      () =>
        document.title.includes("データまとめ") ||
        document.querySelectorAll("#all_data_table tbody tr").length > 0,
      { timeout: 90000 }
    );
  } catch {
    await page.waitForTimeout(15000);
  }

  const title = await page.title();
  const rowCount = await page.$$eval("#all_data_table tbody tr", (r) => r.length).catch(() => 0);
  console.log({ date, title, rowCount, href, url: page.url() });
}

await browser.close();
