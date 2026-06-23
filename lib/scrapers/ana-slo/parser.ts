import * as cheerio from "cheerio";
import { anaSloSelectors, anaSloTableColumns } from "./selectors";
import type { SlotDataInput } from "@/types/slot";

function parseInteger(value: string | undefined): number | null {
  if (!value) return null;
  const normalized = value.replace(/,/g, "").replace(/\+/g, "").trim();
  if (!normalized || normalized === "–" || normalized === "-" || normalized === "—") {
    return null;
  }
  const parsed = Number.parseInt(normalized, 10);
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

export function parseAnaSloDetailPage(
  html: string,
  hallId: string,
  date: Date
): SlotDataInput[] {
  const $ = cheerio.load(html);
  const rows = $(anaSloSelectors.detailPage.dataRows);
  const results: SlotDataInput[] = [];

  rows.each((_, row) => {
    const $row = $(row);
    const machineName = $row.find(anaSloSelectors.detailPage.machineNameCell).text().trim();
    const cells = $row
      .find(anaSloSelectors.detailPage.dataCells)
      .map((__, cell) => $(cell).text().trim())
      .get();

    if (!machineName || cells.length < 5) return;

    const machineNo = cells[anaSloTableColumns.machineNo];
    if (!machineNo) return;

    results.push({
      hallId,
      date,
      machineNo,
      machineName,
      totalGames: parseInteger(cells[anaSloTableColumns.totalGames]),
      diffMedals: parseDiffMedals(cells[anaSloTableColumns.diffMedals]),
      bbCount: parseInteger(cells[anaSloTableColumns.bbCount]),
      rbCount: parseInteger(cells[anaSloTableColumns.rbCount]),
    });
  });

  return results;
}

export function hasDetailTable(html: string): boolean {
  const $ = cheerio.load(html);
  return $(anaSloSelectors.detailPage.dataTable).length > 0;
}
