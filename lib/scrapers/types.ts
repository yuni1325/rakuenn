import type { SlotDataInput } from "@/types/slot";

export type ScrapeDateRangeOptions = {
  onProgress?: (event: {
    date: Date;
    status: "completed" | "failed";
    message?: string;
  }) => void;
  onRecords?: (records: SlotDataInput[]) => Promise<void> | void;
};

export type ScrapeDateRangeResult = {
  records: SlotDataInput[];
  successCount: number;
  failureCount: number;
  aborted: boolean;
  abortReason?: string;
};

export interface HallScraper {
  scrapeByDate(date: Date): Promise<SlotDataInput[]>;
  scrapeByDateRange(
    startDate: Date,
    endDate: Date,
    options?: ScrapeDateRangeOptions
  ): Promise<ScrapeDateRangeResult>;
  close(): Promise<void>;
}
