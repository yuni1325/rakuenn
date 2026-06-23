import { type Browser, type BrowserContext, type Page } from "playwright";
import { createStealthContext, launchStealthBrowser } from "@/lib/scrapers/stealth";
import {
  buildMinRepoReportIndex,
  resolveReportId,
  type MinRepoReportIndex,
} from "./list-index";
import { hasMinRepoAllDataTable, parseMinRepoDetailPage } from "./parser";
import type { SlotDataInput } from "@/types/slot";

export async function createMinRepoBrowser(): Promise<Browser> {
  return launchStealthBrowser({
    headlessDefault: process.env.NODE_ENV === "production",
  });
}

export async function createMinRepoContext(browser: Browser): Promise<BrowserContext> {
  return createStealthContext(browser);
}

export async function loadMinRepoReportIndex(
  page: Page,
  tagListUrl: string
): Promise<MinRepoReportIndex> {
  await page.goto(tagListUrl, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForSelector("table a[href*='min-repo.com/']", { timeout: 30000 });
  await page.waitForTimeout(1000);
  return buildMinRepoReportIndex(await page.content());
}

export async function fetchMinRepoAllDataHtml(
  page: Page,
  reportId: string
): Promise<string> {
  const baseUrl = `https://min-repo.com/${reportId}/`;
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForTimeout(1000);
  await page.goto(`${baseUrl}?kishu=all`, { waitUntil: "domcontentloaded", timeout: 90000 });

  try {
    await page.waitForFunction(
      () => {
        const tables = Array.from(document.querySelectorAll("table"));
        return tables.some((table) => table.textContent?.includes("台番"));
      },
      { timeout: 30000 }
    );
  } catch {
    await page.waitForTimeout(3000);
  }

  return page.content();
}

export async function fetchMinRepoDateRecords(
  page: Page,
  tagListUrl: string,
  reportIndex: MinRepoReportIndex,
  date: Date,
  hallId: string
): Promise<SlotDataInput[]> {
  const reportId = resolveReportId(reportIndex, date);
  if (!reportId) {
    throw new Error(`みんレポに該当日のレポートが見つかりません (${date.toISOString().slice(0, 10)})`);
  }

  const allDataHtml = await fetchMinRepoAllDataHtml(page, reportId);
  if (!hasMinRepoAllDataTable(allDataHtml)) {
    throw new Error(`全台データテーブルが見つかりません (${date.toISOString().slice(0, 10)})`);
  }

  const records = parseMinRepoDetailPage(allDataHtml, hallId, date);
  if (records.length === 0) {
    throw new Error(`台データが0件です (${date.toISOString().slice(0, 10)})`);
  }

  return records;
}

export async function fetchMinRepoDateHtml(
  page: Page,
  tagListUrl: string,
  reportIndex: MinRepoReportIndex,
  date: Date
): Promise<string> {
  const reportId = resolveReportId(reportIndex, date);
  if (!reportId) {
    throw new Error(`みんレポに該当日のレポートが見つかりません (${date.toISOString().slice(0, 10)})`);
  }
  return fetchMinRepoAllDataHtml(page, reportId);
}

export function isBrowserClosedError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return error.message.includes("has been closed");
}
