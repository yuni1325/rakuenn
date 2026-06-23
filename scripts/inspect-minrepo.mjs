import { chromium } from "playwright";
import { writeFileSync } from "fs";

const URLS = [
  "https://min-repo.com/3177331/",
  "https://min-repo.com/tag/%e6%a5%bd%e5%9c%92%e6%9f%8f%e5%ba%97/",
];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  userAgent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  locale: "ja-JP",
});

for (const url of URLS) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(3000);
  const html = await page.content();
  const name = url.includes("tag") ? "minrepo-list" : "minrepo-detail";
  writeFileSync(`scripts/${name}.html`, html, "utf8");

  const tables = await page.$$eval("table", (tables) =>
    tables.map((t, i) => ({
      i,
      className: t.className,
      headers: Array.from(t.querySelectorAll("th")).map((th) => th.textContent?.trim()),
      firstRow: Array.from(t.querySelectorAll("tr")[1]?.querySelectorAll("td, th") || []).map(
        (c) => c.textContent?.trim().slice(0, 40)
      ),
    }))
  );
  console.log(url, "tables:", JSON.stringify(tables.slice(0, 8), null, 2));

  const links = await page.$$eval("a", (as) =>
    as
      .map((a) => ({ href: a.href, text: a.textContent?.trim().slice(0, 30) }))
      .filter((l) => l.href.includes("min-repo.com/3") || l.text?.includes("翌日") || l.text?.includes("前日"))
      .slice(0, 10)
  );
  console.log("links sample:", links);
}

await browser.close();
