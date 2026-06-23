import { chromium } from "playwright";
import { writeFileSync } from "fs";

const reportId = "3177331";
const kishu =
  "スマスロ ミリオンゴッド-神々の軌跡-";
const baseUrl = `https://min-repo.com/${reportId}/`;

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  userAgent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
});

await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForTimeout(1500);

const kishuUrl = `${baseUrl}?kishu=${encodeURIComponent(kishu)}`;
await page.goto(kishuUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForTimeout(2000);

// Try clicking データ一覧 tab if exists
const tabClicked = await page.evaluate(() => {
  const tabs = Array.from(document.querySelectorAll("a, button, li, span, div"));
  const dataTab = tabs.find((el) => el.textContent?.trim() === "データ一覧");
  if (dataTab && "click" in dataTab) {
    dataTab.click();
    return true;
  }
  return false;
});
console.log("tabClicked:", tabClicked);
await page.waitForTimeout(2000);

const info = await page.evaluate(() => {
  const tables = Array.from(document.querySelectorAll("table")).map((t, i) => ({
    i,
    headers: Array.from(t.querySelectorAll("th")).map((th) => th.textContent?.trim()),
    rowCount: t.querySelectorAll("tr").length,
    sampleRows: Array.from(t.querySelectorAll("tr"))
      .slice(0, 4)
      .map((tr) =>
        Array.from(tr.querySelectorAll("td, th")).map((c) => c.textContent?.trim().slice(0, 30))
      ),
  }));

  const links = Array.from(document.querySelectorAll("a"))
    .filter((a) => a.textContent?.includes("データ") || a.href?.includes("kishu"))
    .slice(0, 20)
    .map((a) => ({ text: a.textContent?.trim(), href: a.href }));

  const tabs = Array.from(document.querySelectorAll("[class*='tab'], nav a, .nav a, ul li"))
    .map((el) => el.textContent?.trim())
    .filter((t) => t && t.length < 30)
    .slice(0, 30);

  return { tables, links, tabs };
});

console.log(JSON.stringify(info, null, 2));
writeFileSync("scripts/minrepo-kishu.html", await page.content());
await browser.close();
