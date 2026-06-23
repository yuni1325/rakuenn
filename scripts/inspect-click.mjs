import { chromium } from "playwright";
import { writeFileSync } from "fs";

const LIST_URL =
  "https://ana-slo.com/ホールデータ/千葉県/楽園柏店-データ一覧/";

const browser = await chromium.launch({
  headless: false,
  args: ["--disable-blink-features=AutomationControlled"],
});
const context = await browser.newContext({
  userAgent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  locale: "ja-JP",
});
const page = await context.newPage();

page.on("response", (res) => {
  if (res.url().includes("data") && res.request().resourceType() === "document") {
    console.log("DOC:", res.status(), res.url().slice(0, 100));
  }
});

await page.goto(LIST_URL, { waitUntil: "domcontentloaded", timeout: 90000 });
await page.waitForFunction(() => !document.title.includes("Just a moment"), {
  timeout: 60000,
});
await page.waitForSelector(".date-table a", { timeout: 30000 });

const target = await page.$('a[href*="2026-06-17"]');
if (!target) throw new Error("link not found");
const href = await target.getAttribute("href");
console.log("Target href:", href);

await target.click();
await page.waitForLoadState("domcontentloaded");
try {
  await page.waitForFunction(
    () => {
      const title = document.title;
      const blocked =
        title.includes("しばらく") ||
        title.includes("Just a moment") ||
        title.includes("セキュリティ");
      const hasData = document.querySelectorAll(".table-row").length > 2;
      return !blocked && hasData;
    },
    { timeout: 120000 }
  );
} catch {
  console.log("Fallback wait...");
  await page.waitForTimeout(20000);
}
await page.waitForTimeout(3000);

console.log("URL:", page.url());
console.log("Title:", await page.title());
console.log("Body length:", (await page.innerText("body")).length);

const html = await page.content();
writeFileSync("scripts/detail-page.html", html, "utf8");

const rows = await page.$$eval(".table-row", (els) =>
  els.slice(0, 5).map((r) =>
    Array.from(r.children).map((c) => c.textContent?.trim())
  )
);
console.log("Rows:", JSON.stringify(rows, null, 2));

await browser.close();
