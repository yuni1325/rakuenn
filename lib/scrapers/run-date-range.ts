import { SCRAPE_CONFIG } from "@/lib/scrapers/config";
import type { ScrapeDateRangeOptions, ScrapeDateRangeResult } from "@/lib/scrapers/types";
import { eachDateInRange } from "@/lib/scrapers/date-utils";
import type { SlotDataInput } from "@/types/slot";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type RunDateRangeParams = {
  scrapeByDate: (date: Date) => Promise<SlotDataInput[]>;
  startDate: Date;
  endDate: Date;
  options?: ScrapeDateRangeOptions;
  onBrowserClosed?: () => Promise<void>;
  isBrowserClosedError: (error: unknown) => boolean;
  blockedMessage?: string;
};

export async function runDateRange({
  scrapeByDate,
  startDate,
  endDate,
  options,
  onBrowserClosed,
  isBrowserClosedError,
  blockedMessage,
}: RunDateRangeParams): Promise<ScrapeDateRangeResult> {
  const dates = eachDateInRange(startDate, endDate);
  const allRecords: SlotDataInput[] = [];
  let successCount = 0;
  let failureCount = 0;
  let consecutiveFailures = 0;

  for (const date of dates) {
    try {
      const records = await scrapeByDate(date);
      allRecords.push(...records);
      successCount += 1;
      consecutiveFailures = 0;
      options?.onProgress?.({ date, status: "completed" });
      await options?.onRecords?.(records);
    } catch (error) {
      failureCount += 1;
      consecutiveFailures += 1;
      const message = error instanceof Error ? error.message : "Unknown error";
      options?.onProgress?.({ date, status: "failed", message });

      if (onBrowserClosed && (isBrowserClosedError(error) || message === blockedMessage)) {
        await onBrowserClosed();
      }

      if (consecutiveFailures >= SCRAPE_CONFIG.maxConsecutiveFailures) {
        return {
          records: allRecords,
          successCount,
          failureCount,
          aborted: true,
          abortReason:
            message === blockedMessage
              ? blockedMessage
              : `連続${SCRAPE_CONFIG.maxConsecutiveFailures}日失敗したため中断しました。しばらく待ってから期間を短く分けて再実行してください。`,
        };
      }
    }

    await delay(SCRAPE_CONFIG.delayBetweenDatesMs);
  }

  return {
    records: allRecords,
    successCount,
    failureCount,
    aborted: false,
  };
}
