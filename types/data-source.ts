export type DataSourceId = "ana_slo" | "min_repo";

export const DATA_SOURCE_OPTIONS: { id: DataSourceId; name: string }[] = [
  { id: "ana_slo", name: "アナスロ" },
  { id: "min_repo", name: "みんレポ" },
];

export function isDataSourceId(value: string): value is DataSourceId {
  return value === "ana_slo" || value === "min_repo";
}
