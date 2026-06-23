import type { DataSourceId } from "@/types/data-source";

export type HallSourceConfig = {
  ana_slo?: {
    listUrl: string;
    detailUrlSlug: string;
  };
  min_repo?: {
    tagListUrl: string;
  };
};

export type HallDefinition = {
  id: string;
  name: string;
  sources: HallSourceConfig;
};

export function getHallSource(
  hall: HallDefinition,
  dataSource: "ana_slo"
): NonNullable<HallSourceConfig["ana_slo"]>;
export function getHallSource(
  hall: HallDefinition,
  dataSource: "min_repo"
): NonNullable<HallSourceConfig["min_repo"]>;
export function getHallSource(hall: HallDefinition, dataSource: DataSourceId) {
  const config = hall.sources[dataSource];
  if (!config) {
    throw new Error(`店舗 ${hall.name} はデータソース ${dataSource} に未対応です`);
  }
  return config;
}
