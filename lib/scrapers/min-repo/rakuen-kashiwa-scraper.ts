import type { Browser, BrowserContext, Page } from "playwright";
import { getHall } from "@/lib/halls";
import { getHallSource } from "@/types/hall";
import {
  createMinRepoBrowser,
  createMinRepoContext,
  fetchMinRepoDateRecords,
  isBrowserClosedError,
  loadMinRepoReportIndex,
} from "@/lib/scrapers/min-repo/browser";
import type { MinRepoReportIndex } from "@/lib/scrapers/min-repo/list-index";
import { runDateRange } from "@/lib/scrapers/run-date-range";
import { formatDateString } from "@/lib/scrapers/date-utils";
import type { HallScraper, ScrapeDateRangeOptions, ScrapeDateRangeResult } from "@/lib/scrapers/types";
import type { SlotDataInput } from "@/types/slot";

export class MinRepoRakuenKashiwaScraper implements HallScraper {
  private readonly hallId = "rakuen_kashiwa";
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private reportIndex: MinRepoReportIndex | null = null;

  private async ensurePage(): Promise<Page> {
    if (this.page && !this.page.isClosed()) return this.page;

    const hall = getHall(this.hallId);
    const source = getHallSource(hall, "min_repo");
    this.browser = await createMinRepoBrowser();
    this.context = await createMinRepoContext(this.browser);
    this.page = await this.context.newPage();
    this.reportIndex = await loadMinRepoReportIndex(this.page, source.tagListUrl);

    return this.page;
  }

  private async resetSession(): Promise<void> {
    await this.close();
    await this.ensurePage();
  }

  async scrapeByDate(date: Date): Promise<SlotDataInput[]> {
    const hall = getHall(this.hallId);
    const source = getHallSource(hall, "min_repo");
    const dateLabel = formatDateString(date);

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const page = await this.ensurePage();
        if (!this.reportIndex) {
          this.reportIndex = await loadMinRepoReportIndex(page, source.tagListUrl);
        }

        const records = await fetchMinRepoDateRecords(
          page,
          source.tagListUrl,
          this.reportIndex,
          date,
          this.hallId
        );

        if (records.length === 0) {
          throw new Error(`台データが0件です (${dateLabel})`);
        }

        return records;
      } catch (error) {
        if (attempt === 0 && isBrowserClosedError(error)) {
          await this.resetSession();
          continue;
        }
        throw error;
      }
    }

    throw new Error(`データ取得に失敗しました (${dateLabel})`);
  }

  async scrapeByDateRange(
    startDate: Date,
    endDate: Date,
    options?: ScrapeDateRangeOptions
  ): Promise<ScrapeDateRangeResult> {
    return runDateRange({
      scrapeByDate: (date) => this.scrapeByDate(date),
      startDate,
      endDate,
      options,
      onBrowserClosed: () => this.resetSession(),
      isBrowserClosedError,
    });
  }

  async close(): Promise<void> {
    if (this.page && !this.page.isClosed()) {
      await this.page.close();
    }
    await this.context?.close();
    await this.browser?.close();
    this.page = null;
    this.context = null;
    this.browser = null;
    this.reportIndex = null;
  }
}
