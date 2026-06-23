import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const rows = await prisma.slotData.findMany({
  where: {
    date: new Date("2026-06-20T00:00:00.000Z"),
    machineNo: { in: ["539", "541", "542"] },
  },
  select: { machineNo: true, machineName: true, bbCount: true, rbCount: true },
});
console.log(JSON.stringify(rows, null, 2));
const withBonus = await prisma.slotData.count({
  where: {
    date: new Date("2026-06-20T00:00:00.000Z"),
    OR: [{ bbCount: { not: null } }, { rbCount: { not: null } }],
  },
});
console.log("withBonus:", withBonus);
await prisma.$disconnect();
