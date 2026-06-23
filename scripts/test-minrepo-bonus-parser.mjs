import { readFileSync } from "fs";
import {
  parseMinRepoDetailPage,
  parseMinRepoKishuDataList,
  parseMinRepoKishuLinks,
  mergeMinRepoBonusData,
} from "../lib/scrapers/min-repo/parser.ts";

const allHtml = readFileSync("scripts/minrepo-all-session.html", "utf8");
const kishuHtml = readFileSync("scripts/minrepo-kishu.html", "utf8");
const date = new Date(Date.UTC(2026, 5, 20));

const records = parseMinRepoDetailPage(allHtml, "rakuen_kashiwa", date);
const links = parseMinRepoKishuLinks(allHtml);
const bonus = parseMinRepoKishuDataList(kishuHtml);
const merged = mergeMinRepoBonusData(records, bonus);

console.log("records:", records.length);
console.log("kishu links:", links.length);
console.log("bonus entries:", bonus.size);
console.log("merged with BB:", merged.filter((r) => r.bbCount !== null || r.rbCount !== null).length);
console.log("sample merged:", merged.find((r) => r.machineNo === "541"));
