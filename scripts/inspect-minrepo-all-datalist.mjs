import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  userAgent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
});

await page.goto("https://min-repo.com/3177331/", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1000);
await page.goto("https://min-repo.com/3177331/?kishu=all", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2000);

// click データ一覧 on all page
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
  return Array.from(document.querySelectorAll("table"))
    .map((t, i) => ({
      i,
      headers: Array.from(t.querySelectorAll("th")).map((th) => th.textContent?.trim()),
      sample: Array.from(t.querySelectorAll("tr")).slice(0, 2).map((tr) =>
        Array.from(tr.querySelectorAll("td, th")).map((c) => c.textContent?.trim().slice(0, 20))
      ),
    }))
    .filter((t) => t.headers.some((h) => h?.includes("BB") || h?.includes("台番")));
});

console.log(JSON.stringify(info, null, 2));
await browser.close();
