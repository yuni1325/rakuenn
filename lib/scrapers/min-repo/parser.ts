import * as cheerio from "cheerio";
import type { Element } from "domhandler";
import { minRepoSelectors } from "./selectors";
import type { SlotDataInput } from "@/types/slot";

function parseInteger(value: string | undefined): number | null {
  if (!value) return null;
  const normalized = value.replace(/,/g, "").replace(/\+/g, "").trim();
  if (!normalized || normalized === "–" || normalized === "-" || normalized === "—") {
    return null;
  }
  const digits = normalized.replace(/[^0-9]/g, "");
  if (!digits) return null;
  const parsed = Number.parseInt(digits, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function parseDiffMedals(value: string | undefined): number | null {
  if (!value) return null;
  const normalized = value.replace(/,/g, "").trim();
  if (!normalized || normalized === "–" || normalized === "-" || normalized === "—") {
    return null;
  }
  const sign = normalized.startsWith("-") ? -1 : 1;
  const digits = normalized.replace(/[^0-9]/g, "");
  if (!digits) return null;
  return sign * Number.parseInt(digits, 10);
}

function findTableByHeaders(
  $: cheerio.CheerioAPI,
  requiredHeaders: string[]
): Element | null {
  let target: Element | null = null;

  $("table").each((_, table) => {
    const headers = $(table)
      .find("th")
      .map((__, th) => $(th).text().trim())
      .get();
    if (requiredHeaders.every((header) => headers.includes(header))) {
      target = table;
    }
  });

  return target;
}

function findAllDataTable($: cheerio.CheerioAPI): Element | null {
  return findTableByHeaders($, ["台番", "G数"]);
}

export function parseMinRepoDetailPage(
  html: string,
  hallId: string,
  date: Date
): SlotDataInput[] {
  const $ = cheerio.load(html);
  const tableEl = findAllDataTable($);
  if (!tableEl) return [];

  const table = $(tableEl);

  const results: SlotDataInput[] = [];
  const { groupSize } = minRepoSelectors.tableColumns;

  table.find("tr").each((_, row) => {
    const tds = $(row).find("td").toArray();

    for (let i = 0; i + groupSize <= tds.length; i += groupSize) {
      const machineName = $(tds[i]).text().trim();
      const machineNo = $(tds[i + 1]).text().trim();
      const diffMedals = parseDiffMedals($(tds[i + 2]).text().trim());
      const totalGames = parseInteger($(tds[i + 3]).text().trim());

      if (!machineName || !machineNo || !/^\d+$/.test(machineNo)) continue;

      results.push({
        hallId,
        date,
        machineNo,
        machineName,
        diffMedals,
        totalGames,
        bbCount: null,
        rbCount: null,
      });
    }
  });

  return results;
}

export function hasMinRepoAllDataTable(html: string): boolean {
  const $ = cheerio.load(html);
  return findAllDataTable($) !== null;
}

export function parseMinRepoPageDate(html: string): Date | null {
  const $ = cheerio.load(html);
  const datetime = $("time.date").attr("datetime");
  if (!datetime) return null;
  const parsed = new Date(datetime);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Date(
    Date.UTC(parsed.getFullYear(), parsed.getMonth(), parsed.getDate())
  );
}
