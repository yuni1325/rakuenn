import { chromium } from "playwright";
import { writeFileSync } from "fs";

const LIST_URL =
  "https://ana-slo.com/ホールデータ/千葉県/楽園柏店-データ一覧/";

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
await page.goto(LIST_URL, { waitUntil: "domcontentloaded", timeout: 90000 });

// Cloudflare Turnstile 通過を待つ
try {
  await page.waitForFunction(
    () => !document.title.includes("Just a moment"),
    { timeout: 60000 }
  );
} catch {
  console.log("Still on challenge page, waiting more...");
  await page.waitForTimeout(15000);
}
await page.waitForTimeout(3000);

const html = await page.content();
writeFileSync("scripts/list-page.html", html, "utf8");

// Find date links
const links = await page.$$eval("a", (as) =>
  as
    .map((a) => ({ href: a.href, text: a.textContent?.trim() }))
    .filter((l) => l.href.includes("楽園柏店") || /\d{4}/.test(l.text || ""))
    .slice(0, 30)
);
console.log("Sample links:", JSON.stringify(links, null, 2));

// Try to find table structure on list page
const tables = await page.$$eval("table", (tables) =>
  tables.map((t, i) => ({
    index: i,
    className: t.className,
    id: t.id,
    rowCount: t.querySelectorAll("tr").length,
    firstRowHtml: t.querySelector("tr")?.innerHTML?.slice(0, 500),
  }))
);
console.log("Tables on list page:", JSON.stringify(tables, null, 2));

// Navigate to first date link by clicking (same session)
const dateLinkEl = await page.$('a[href*="楽園柏店-data"], a[href*="%e6%a5%bd%e5%9c%92%e6%9f%8f%e5%ba%97-data"]');
if (dateLinkEl) {
  const href = await dateLinkEl.getAttribute("href");
  console.log("Clicking:", href);
  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 90000 }),
    dateLinkEl.click(),
  ]);
  try {
    await page.waitForFunction(
      () => document.querySelectorAll("table").length > 0 || document.body.innerText.length > 500,
      { timeout: 60000 }
    );
  } catch {
    await page.waitForTimeout(15000);
  }
  await page.waitForTimeout(3000);
  const detailHtml = await page.content();
  writeFileSync("scripts/detail-page.html", detailHtml, "utf8");
  console.log("Detail page title:", await page.title());

  const detailTables = await page.$$eval("table", (tables) =>
    tables.map((t, i) => ({
      index: i,
      className: t.className,
      id: t.id,
      rowCount: t.querySelectorAll("tr").length,
      headers: Array.from(t.querySelectorAll("th")).map((th) => th.textContent?.trim()),
      firstDataRow: Array.from(t.querySelectorAll("tr")[1]?.querySelectorAll("td") || []).map(
        (td) => td.textContent?.trim()
      ),
    }))
  );
  console.log("Tables on detail page:", JSON.stringify(detailTables, null, 2));

  const allClasses = await page.$$eval("[class]", (els) => {
    const counts = {};
    els.forEach((el) => {
      el.className.split(/\s+/).forEach((c) => {
        if (c) counts[c] = (counts[c] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .filter(([k]) => k.includes("table") || k.includes("data") || k.includes("slot") || k.includes("machine") || k.includes("hall"))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30);
  });
  console.log("Relevant classes:", allClasses);
}

await browser.close();
console.log("Done. HTML saved to scripts/");
