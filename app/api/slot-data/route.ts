import { prisma } from "@/lib/db/prisma";
import { parseDateString } from "@/lib/scrapers/date-utils";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const hallId = searchParams.get("hallId");
  const dateStr = searchParams.get("date");
  const sortBy = searchParams.get("sortBy") ?? "machineNo";
  const sortOrder = searchParams.get("sortOrder") === "desc" ? "desc" : "asc";

  if (!hallId || !dateStr) {
    return Response.json({ error: "hallId and date are required" }, { status: 400 });
  }

  const date = parseDateString(dateStr);
  const nextDate = new Date(date);
  nextDate.setUTCDate(nextDate.getUTCDate() + 1);

  const records = await prisma.slotData.findMany({
    where: {
      hallId,
      date: {
        gte: date,
        lt: nextDate,
      },
    },
    orderBy: {
      [sortBy]: sortOrder,
    },
  });

  const validRecords = records.filter((r) => r.diffMedals !== null);
  const totalMachines = records.length;
  const totalDiff = records.reduce((sum, r) => sum + (r.diffMedals ?? 0), 0);
  const plusCount = validRecords.filter((r) => (r.diffMedals ?? 0) > 0).length;
  const averageDiff =
    validRecords.length > 0
      ? Math.round(
          validRecords.reduce((sum, r) => sum + (r.diffMedals ?? 0), 0) /
            validRecords.length
        )
      : 0;
  const plusRatio =
    validRecords.length > 0
      ? Math.round((plusCount / validRecords.length) * 1000) / 10
      : 0;

  return Response.json({
    summary: {
      totalMachines,
      averageDiff,
      plusRatio,
      totalDiff,
    },
    records: records.map((r) => ({
      id: r.id,
      machineNo: r.machineNo,
      machineName: r.machineName,
      bbCount: r.bbCount,
      rbCount: r.rbCount,
      totalGames: r.totalGames,
      diffMedals: r.diffMedals,
    })),
  });
}
