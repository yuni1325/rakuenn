import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import { formatDateString } from "@/lib/scrapers/date-utils";
import { isHeadlessEnabled } from "@/lib/scrapers/stealth/config";
import { anaSloSelectors } from "./selectors";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const NAV_OPTIONS = { waitUntil: "domcontentloaded" as const, timeout: 90000 };

const AD_HOST_PATTERN = /p-world\.co\.jp|ads\.yahoo\.com|taboola\.com|outbrain\.com/i;

/**
 * ana-slo.com は Cloudflare が厳しいため、過剰なステルスパッチより
 * headed + bundled Chromium + 一覧セッション温め後の遷移が有効。
 */
export async function createAnaSloBrowser(): Promise<Browser> {
  const headless = isHeadlessEnabled(process.env.NODE_ENV === "production");

  if (process.env.NODE_ENV === "development") {
    console.info(`[playwright:ana-slo] launch headless=${headless} channel=bundled-chromium`);
  }

  return chromium.launch({
    headless,
    args: ["--disable-blink-features=AutomationControlled", "--disable-popup-blocking"],
  });
}

const OVERLAY_BLOCK_SCRIPT = `
(() => {
  const style = document.createElement("style");
  style.textContent = [
    "#overlay_ads, #overlay_ads_area, .add-control .box {",
    "  display: none !important;",
    "  visibility: hidden !important;",
    "  pointer-events: none !important;",
    "}",
    "body { padding: 0 !important; }",
  ].join("\\n");
  (document.head || document.documentElement).appendChild(style);

  const dismissOverlayAds = () => {
    document.getElementById("overlay_ads")?.remove();
    document.getElementById("overlay_ads_area")?.remove();
    const close = document.getElementById("close");
    if (close instanceof HTMLInputElement) {
      close.checked = true;
    }
    document.body.style.padding = "0";
    document.body.removeAttribute("aria-hidden");
  };

  dismissOverlayAds();

  const observer = new MutationObserver(() => {
    if (document.getElementById("overlay_ads")) {
      dismissOverlayAds();
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
`;

export async function createAnaSloContext(browser: Browser): Promise<BrowserContext> {
  const context = await browser.newContext({
    userAgent: USER_AGENT,
    locale: "ja-JP",
    timezoneId: "Asia/Tokyo",
  });

  await context.addInitScript({ content: OVERLAY_BLOCK_SCRIPT });

  await context.route(AD_HOST_PATTERN, (route) => route.abort());

  // 広告サイトが別タブで開いた場合のみ閉じる（newPage のメインタブは opener が null）
  context.on("page", async (popup) => {
    if (!popup.opener()) {
      return;
    }

    try {
      await popup.waitForLoadState("domcontentloaded", { timeout: 5000 });
    } catch {
      // ignore
    }

    const url = popup.url();
    if (!url || url === "about:blank") {
      return;
    }

    if (AD_HOST_PATTERN.test(url)) {
      if (process.env.NODE_ENV === "development") {
        console.info(`[playwright:ana-slo] close ad popup ${url}`);
      }
      await popup.close().catch(() => {});
    }
  });

  return context;
}

export async function dismissOverlays(page: Page): Promise<void> {
  await page.evaluate(() => {
    document.getElementById("overlay_ads")?.remove();
    document.getElementById("overlay_ads_area")?.remove();
    const close = document.getElementById("close");
    if (close instanceof HTMLInputElement) {
      close.checked = true;
    }
    document.body.style.padding = "0";
    document.body.removeAttribute("aria-hidden");
  });
}

async function revealAllDataTable(page: Page): Promise<void> {
  await page.evaluate(() => {
    const block = document.getElementById("all_data_block");
    if (block instanceof HTMLElement) {
      block.style.display = "block";
    }

    const win = window as unknown as { clickAllDataBtn?: () => void };
    if (typeof win.clickAllDataBtn === "function") {
      win.clickAllDataBtn();
      return;
    }

    document.getElementById("all_data_btn")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

export async function waitForCloudflare(page: Page): Promise<void> {
  try {
    await page.waitForFunction(() => {
      const title = document.title;
      const blockedTitles = ["Just a moment", "しばらく", "セキュリティ"];
      if (blockedTitles.some((blocked) => title.includes(blocked))) {
        return false;
      }
      if (
        document.querySelector("#challenge-running, #challenge-stage, .cf-browser-verification")
      ) {
        return false;
      }
      return true;
    }, { timeout: 90000 });
  } catch {
    await page.waitForTimeout(15000);
  }

  await page.waitForTimeout(1000);
}

async function waitForDetailPage(page: Page): Promise<void> {
  try {
    await page.waitForFunction(
      () => document.querySelectorAll("#all_data_table tbody tr").length > 0,
      { timeout: 90000 }
    );
  } catch {
    await page.waitForTimeout(10000);
  }

  await revealAllDataTable(page);
  await page.waitForTimeout(1000);
}

async function openListPage(page: Page, listUrl: string): Promise<void> {
  await page.goto(listUrl, NAV_OPTIONS);
  await waitForCloudflare(page);
  await dismissOverlays(page);
  await page.waitForSelector(anaSloSelectors.listPage.dateTable, { timeout: 30000 });
  await dismissOverlays(page);
}

/**
 * クリックはオーバーレイ広告に奪われるため、同一タブ内で JS 遷移する。
 */
async function openDetailByHref(page: Page, href: string): Promise<void> {
  await dismissOverlays(page);

  const absoluteHref = new URL(href, page.url()).href;

  try {
    await Promise.all([
      page.waitForURL((url) => url.href.includes("-data"), {
        ...NAV_OPTIONS,
        timeout: 90000,
      }),
      page.evaluate((url) => {
        window.location.assign(url);
      }, absoluteHref),
    ]);
    return;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[playwright:ana-slo] location.assign failed, fallback goto", error);
    }
  }

  await page.goto(absoluteHref, NAV_OPTIONS);
}

export async function navigateAndGetHtml(page: Page, url: string): Promise<string> {
  await page.goto(url, NAV_OPTIONS);
  await waitForCloudflare(page);
  await dismissOverlays(page);
  return page.content();
}

export async function warmupAnaSloSession(page: Page, listUrl: string): Promise<void> {
  await openListPage(page, listUrl);
}

/**
 * 一覧でセッションを温めてから詳細 URL へ遷移する（クリックは使わない）。
 */
export async function navigateToDetailFromList(
  page: Page,
  listUrl: string,
  date: Date,
  detailUrlSlug: string
): Promise<string> {
  const dateKey = formatDateString(date);
  const linkSelector = anaSloSelectors.listPage.dateLink(dateKey, detailUrlSlug);

  await openListPage(page, listUrl);

  const link = page.locator(linkSelector).first();
  await link.waitFor({ state: "attached", timeout: 30000 });

  const href = await link.getAttribute("href");
  if (!href) {
    throw new Error(`日付リンクが見つかりません (${dateKey})`);
  }

  if (process.env.NODE_ENV === "development") {
    console.info(`[playwright:ana-slo] navigate detail ${dateKey} -> ${href}`);
  }

  await openDetailByHref(page, href);
  await waitForCloudflare(page);
  await dismissOverlays(page);
  await waitForDetailPage(page);

  const rowCount = await page.locator("#all_data_table tbody tr").count();
  if (rowCount === 0) {
    throw new Error(`詳細ページの台データが0件です (${dateKey})`);
  }

  if (process.env.NODE_ENV === "development") {
    console.info(
      `[playwright:ana-slo] detail ready ${page.url()} rows=${rowCount} title=${await page.title()}`
    );
  }

  return page.content();
}

export function buildAnaSloDetailUrl(date: Date, detailUrlSlug: string): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `https://ana-slo.com/${y}-${m}-${d}-${detailUrlSlug}-data/`;
}

export function isBrowserClosedError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return error.message.includes("has been closed");
}
