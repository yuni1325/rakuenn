import { AnaSloRakuenKashiwaScraper } from "@/lib/scrapers/ana-slo/rakuen-kashiwa-scraper";
import { MinRepoRakuenKashiwaScraper } from "@/lib/scrapers/min-repo/rakuen-kashiwa-scraper";
import type { HallScraper } from "@/lib/scrapers/types";
import type { DataSourceId } from "@/types/data-source";
import { getHall } from "@/lib/halls";

export function createHallScraper(hallId: string, dataSource: DataSourceId): HallScraper {
  const hall = getHall(hallId);
  if (!hall.sources[dataSource]) {
    throw new Error(`店舗 ${hall.name} はデータソース ${dataSource} に未対応です`);
  }

  if (hallId === "rakuen_kashiwa") {
    if (dataSource === "ana_slo") {
      return new AnaSloRakuenKashiwaScraper();
    }
    if (dataSource === "min_repo") {
      return new MinRepoRakuenKashiwaScraper();
    }
  }

  throw new Error(`Unsupported hallId/dataSource: ${hallId}/${dataSource}`);
}

export { AnaSloRakuenKashiwaScraper } from "@/lib/scrapers/ana-slo/rakuen-kashiwa-scraper";
export { MinRepoRakuenKashiwaScraper } from "@/lib/scrapers/min-repo/rakuen-kashiwa-scraper";
export type { HallScraper } from "@/lib/scrapers/types";
