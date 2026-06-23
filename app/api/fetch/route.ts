import { prisma } from "@/lib/db/prisma";
import { createHallScraper } from "@/lib/scrapers";
import { SCRAPE_CONFIG } from "@/lib/scrapers/config";
import { countDaysInRange, formatDateString, parseDateString } from "@/lib/scrapers/date-utils";
import { upsertSlotDataBatch } from "@/lib/scrapers/save-slot-data";
import { isDataSourceId, type DataSourceId } from "@/types/data-source";
import type { FetchProgressEvent, FetchResult } from "@/types/slot";

export const maxDuration = 300;

type FetchRequestBody = {
  hallId: string;
  dataSource?: string;
  startDate: string;
  endDate: string;
  stream?: boolean;
};

function validateBody(body: FetchRequestBody): {
  hallId: string;
  dataSource: DataSourceId;
  startDate: Date;
  endDate: Date;
} {
  if (!body.hallId || !body.startDate || !body.endDate) {
    throw new Error("hallId, startDate, endDate are required");
  }

  const dataSource = body.dataSource ?? "ana_slo";
  if (!isDataSourceId(dataSource)) {
    throw new Error("dataSource must be ana_slo or min_repo");
  }

  const startDate = parseDateString(body.startDate);
  const endDate = parseDateString(body.endDate);

  if (startDate > endDate) {
    throw new Error("startDate must be before or equal to endDate");
  }

  const dayCount = countDaysInRange(startDate, endDate);
  if (dayCount > SCRAPE_CONFIG.maxDaysPerRun) {
    throw new Error(
      `一度に取得できるのは最大${SCRAPE_CONFIG.maxDaysPerRun}日です（指定: ${dayCount}日）。期間を分けて実行してください。`
    );
  }

  return { hallId: body.hallId, dataSource, startDate, endDate };
}

async function runFetch(
  hallId: string,
  dataSource: DataSourceId,
  startDate: Date,
  endDate: Date,
  onProgress?: (event: FetchProgressEvent) => void
): Promise<FetchResult> {
  const scraper = createHallScraper(hallId, dataSource);
  const runDate = new Date();
  let savedCount = 0;

  try {
    const scrapeResult = await scraper.scrapeByDateRange(startDate, endDate, {
      onProgress: (event) => {
        onProgress?.({
          type: "progress",
          date: formatDateString(event.date),
          status: event.status,
          message: event.message,
        });
      },
      onRecords: async (records) => {
        savedCount += await upsertSlotDataBatch(records);
      },
    });

    if (scrapeResult.aborted && scrapeResult.abortReason) {
      onProgress?.({ type: "aborted", reason: scrapeResult.abortReason });
    }

    const days = countDaysInRange(startDate, endDate);

    const result: FetchResult = {
      success: scrapeResult.failureCount === 0 && !scrapeResult.aborted,
      days,
      records: savedCount,
      successCount: scrapeResult.successCount,
      failureCount: scrapeResult.failureCount,
      aborted: scrapeResult.aborted,
      abortReason: scrapeResult.abortReason,
    };

    await prisma.scrapeLog.create({
      data: {
        runDate,
        startDate,
        endDate,
        success: result.success,
        message: `source=${dataSource}, records=${savedCount}, success=${scrapeResult.successCount}, failure=${scrapeResult.failureCount}, aborted=${scrapeResult.aborted}`,
      },
    });

    onProgress?.({ type: "complete", result });
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    await prisma.scrapeLog.create({
      data: {
        runDate,
        startDate,
        endDate,
        success: false,
        message: `${message} (saved=${savedCount})`,
      },
    });

    throw error;
  } finally {
    await scraper.close();
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as FetchRequestBody;
    const { hallId, dataSource, startDate, endDate } = validateBody(body);

    if (body.stream) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          const send = (event: FetchProgressEvent) => {
            controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
          };

          try {
            await runFetch(hallId, dataSource, startDate, endDate, send);
          } catch (error) {
            const message = error instanceof Error ? error.message : "Unknown error";
            send({
              type: "complete",
              result: {
                success: false,
                days: 0,
                records: 0,
                successCount: 0,
                failureCount: 0,
              },
            });
            controller.enqueue(encoder.encode(`${JSON.stringify({ type: "error", message })}\n`));
          } finally {
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "application/x-ndjson; charset=utf-8",
          "Cache-Control": "no-cache",
        },
      });
    }

    const result = await runFetch(hallId, dataSource, startDate, endDate);
    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ success: false, error: message }, { status: 400 });
  }
}
