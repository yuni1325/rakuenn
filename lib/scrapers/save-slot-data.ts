import { prisma } from "@/lib/db/prisma";
import type { SlotDataInput } from "@/types/slot";

export async function upsertSlotDataBatch(records: SlotDataInput[]): Promise<number> {
  let count = 0;

  for (const record of records) {
    await prisma.slotData.upsert({
      where: {
        hallId_date_machineNo: {
          hallId: record.hallId,
          date: record.date,
          machineNo: record.machineNo,
        },
      },
      create: record,
      update: {
        machineName: record.machineName,
        bbCount: record.bbCount,
        rbCount: record.rbCount,
        totalGames: record.totalGames,
        diffMedals: record.diffMedals,
      },
    });
    count += 1;
  }

  return count;
}
