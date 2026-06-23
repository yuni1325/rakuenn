import { readFileSync } from "fs";
import { parseMinRepoDetailPage } from "../lib/scrapers/min-repo/parser.ts";

const html = readFileSync("scripts/minrepo-all-session.html", "utf8");
const date = new Date(Date.UTC(2026, 5, 20));
const records = parseMinRepoDetailPage(html, "rakuen_kashiwa", date);

console.log("records:", records.length);
console.log("sample:", records[0], records[1]);
