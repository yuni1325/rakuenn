import { chromium } from "playwright";
import * as cheerio from "cheerio";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  userAgent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
});

await page.goto("https://min-repo.com/3177331/", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1000);
await page.goto("https://min-repo.com/3177331/?kishu=all", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(3000);

const html = await page.content();
const $ = cheerio.load(html);

const kishuLinks = new Map();
$("a[href*='kishu=']").each((_, a) => {
  const href = $(a).attr("href") ?? "";
  const match = href.match(/kishu=([^&]+)/);
  if (!match) return;
  const kishu = decodeURIComponent(match[1].replace(/\+/g, " "));
  if (kishu === "all") return;
  kishuLinks.set(kishu, href);
});

console.log("unique kishu count:", kishuLinks.size);
console.log("samples:", [...kishuLinks.entries()].slice(0, 5));

// count machines in all table
let machineCount = 0;
const machineNames = new Set();
$("table").each((_, table) => {
  const headers = $(table).find("th").map((__, th) => $(th).text().trim()).get();
  if (!headers.includes("台番") || !headers.includes("G数")) return;
  $(table).find("tr").each((__, row) => {
    const tds = $(row).find("td").toArray();
    for (let i = 0; i + 5 <= tds.length; i += 5) {
      const name = $(tds[i]).text().trim();
      const no = $(tds[i + 1]).text().trim();
      if (/^\d+$/.test(no)) {
        machineCount++;
        machineNames.add(name);
      }
    }
  });
});
console.log("machines:", machineCount, "unique names:", machineNames.size);

await browser.close();
