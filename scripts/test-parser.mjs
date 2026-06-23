import { readFileSync } from "fs";
import { parseAnaSloDetailPage } from "../lib/scrapers/ana-slo/parser";

const html = readFileSync("scripts/detail-page.html", "utf8");
const date = new Date(Date.UTC(2026, 5, 17));
const records = parseAnaSloDetailPage(html, "rakuen_kashiwa", date);

console.log("records:", records.length);
console.log("sample:", records[0]);
