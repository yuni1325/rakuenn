import * as cheerio from "cheerio";
import { formatDateString } from "@/lib/scrapers/date-utils";

export type MinRepoReportIndex = Map<string, string>;

function parseLinkDateText(
  text: string,
  yearContext: number
): { year: number; month: number; day: number } | null {
  const cleaned = text.replace(/\(.+\)/, "").trim();
  const withYear = cleaned.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (withYear) {
    return {
      year: Number(withYear[1]),
      month: Number(withYear[2]),
      day: Number(withYear[3]),
    };
  }

  const short = cleaned.match(/^(\d{1,2})\/(\d{1,2})$/);
  if (short) {
    return {
      year: yearContext,
      month: Number(short[1]),
      day: Number(short[2]),
    };
  }

  return null;
}

function extractReportId(href: string): string | null {
  const match = href.match(/min-repo\.com\/(\d+)\/?/);
  return match?.[1] ?? null;
}

export function buildMinRepoReportIndex(html: string): MinRepoReportIndex {
  const $ = cheerio.load(html);
  const index: MinRepoReportIndex = new Map();
  let yearContext = new Date().getFullYear();

  $("table a[href*='min-repo.com/']").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    const text = $(el).text().trim();
    const reportId = extractReportId(href);
    if (!reportId) return;

    const fullYearMatch = text.match(/^(\d{4})\//);
    if (fullYearMatch) {
      yearContext = Number(fullYearMatch[1]);
    }

    const parts = parseLinkDateText(text, yearContext);
    if (!parts) return;

    const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
    index.set(formatDateString(date), reportId);
  });

  return index;
}

export function resolveReportId(index: MinRepoReportIndex, date: Date): string | null {
  return index.get(formatDateString(date)) ?? null;
}
