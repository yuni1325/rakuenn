import type { HallDefinition } from "@/types/hall";

export { getHallSource } from "@/types/hall";

export const HALLS: Record<string, HallDefinition> = {
  rakuen_kashiwa: {
    id: "rakuen_kashiwa",
    name: "楽園柏店",
    sources: {
      ana_slo: {
        listUrl:
          "https://ana-slo.com/ホールデータ/千葉県/楽園柏店-データ一覧/",
        detailUrlSlug: "%e6%a5%bd%e5%9c%92%e6%9f%8f%e5%ba%97",
      },
      min_repo: {
        tagListUrl: "https://min-repo.com/tag/%e6%a5%bd%e5%9c%92%e6%9f%8f%e5%ba%97/",
      },
    },
  },
};

export function getHall(hallId: string): HallDefinition {
  const hall = HALLS[hallId];
  if (!hall) {
    throw new Error(`Unknown hallId: ${hallId}`);
  }
  return hall;
}

export const HALL_OPTIONS = Object.values(HALLS).map((hall) => ({
  id: hall.id,
  name: hall.name,
}));
