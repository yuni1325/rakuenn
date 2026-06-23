import { chromium } from "playwright";

const LIST_URL =
  "https://ana-slo.com/ホールデータ/千葉県/楽園柏店-データ一覧/";
const DETAIL_URL =
  "https://ana-slo.com/2026-06-17-%e6%a5%bd%e5%9c%92%e6%9f%8f%e5%ba%97-data/";

async function passCF(page) {
  try {
    await page.waitForFunction(
      () => {
        const t = document.title;
        return (
          !t.includes("Just a moment") &&
          !t.includes("しばらく") &&
          !t.includes("セキュリティ")
        );
      },
      { timeout: 90000 }
    );
  } catch {
    await page.waitForTimeout(15000);
  }
}

for (const headless of [true, "shell"]) {
  const browser = await chromium.launch({
    headless,
    args: ["--disable-blink-features=AutomationControlled"],
  });
  const page = await browser.newPage({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    locale: "ja-JP",
  });
  await page.goto(LIST_URL, { waitUntil: "domcontentloaded", timeout: 90000 });
  await passCF(page);
  console.log(`headless=${headless} list:`, await page.title());
  await page.goto(DETAIL_URL, { waitUntil: "domcontentloaded", timeout: 90000 });
  await passCF(page);
  await page.waitForTimeout(3000);
  const rows = await page.$$eval("#all_data_table tbody tr", (trs) => trs.length);
  console.log(`headless=${headless} detail:`, await page.title(), "rows:", rows);
  await browser.close();
}
