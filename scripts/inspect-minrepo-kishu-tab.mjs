import { chromium } from "playwright";
import * as cheerio from "cheerio";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  userAgent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
});

const url =
  "https://min-repo.com/3177331/?kishu=" +
  encodeURIComponent("スマスロ ミリオンゴッド-神々の軌跡-");
await page.goto("https://min-repo.com/3177331/", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1000);
await page.goto(url, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2000);

const htmlBefore = await page.content();
const $b = cheerio.load(htmlBefore);
const tablesBefore = $b("table")
  .toArray()
  .map((t) => $b(t).find("th").map((__, th) => $b(th).text().trim()).get())
  .filter((h) => h.includes("BB"));
console.log("BB tables before click:", tablesBefore.length);

await page.evaluate(() => {
  const tab = Array.from(document.querySelectorAll(".tab li")).find((el) =>
    el.textContent?.includes("データ一覧")
  );
  tab?.click();
});
await page.waitForTimeout(1000);

const htmlAfter = await page.content();
const $a = cheerio.load(htmlAfter);
const tablesAfter = $a("table")
  .toArray()
  .map((t) => $a(t).find("th").map((__, th) => $a(th).text().trim()).get())
  .filter((h) => h.includes("BB"));
console.log("BB tables after click:", tablesAfter.length);

// check if BB table exists in HTML before click but hidden
const hiddenBb = $b(".tab_content table").toArray().length;
console.log("tab_content tables before click:", hiddenBb);

await browser.close();
