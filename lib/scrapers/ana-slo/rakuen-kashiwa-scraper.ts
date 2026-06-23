import type { Browser, BrowserContext, Page } from "playwright";
import { getHall } from "@/lib/halls";
import { getHallSource } from "@/types/hall";
import {
  createAnaSloBrowser,
  createAnaSloContext,
  isBrowserClosedError,
  navigateToDetailFromList,
  warmupAnaSloSession,
} from "@/lib/scrapers/ana-slo/browser";
import { BLOCKED_MESSAGE, isLikelyBlocked } from "@/lib/scrapers/ana-slo/guards";
import { hasDetailTable, parseAnaSloDetailPage } from "@/lib/scrapers/ana-slo/parser";
import { runDateRange } from "@/lib/scrapers/run-date-range";
import { formatDateString } from "@/lib/scrapers/date-utils";
import type { HallScraper, ScrapeDateRangeOptions, ScrapeDateRangeResult } from "@/lib/scrapers/types";
import type { SlotDataInput } from "@/types/slot";

export class AnaSloRakuenKashiwaScraper implements HallScraper {
  private readonly hallId = "rakuen_kashiwa";
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;

  private async ensurePage(): Promise<Page> {
    if (this.page && !this.page.isClosed()) return this.page;

    const hall = getHall(this.hallId);
    const source = getHallSource(hall, "ana_slo");
    this.browser = await createAnaSloBrowser();
    this.context = await createAnaSloContext(this.browser);
    this.page = await this.context.newPage();
    await warmupAnaSloSession(this.page, source.listUrl);

    return this.page;
  }

  private async resetSession(): Promise<void> {
    await this.close();
    await this.ensurePage();
  }

  async scrapeByDate(date: Date): Promise<SlotDataInput[]> {
    const hall = getHall(this.hallId);
    const source = getHallSource(hall, "ana_slo");
    const dateLabel = formatDateString(date);

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const page = await this.ensurePage();
        const html = await navigateToDetailFromList(
          page,
          source.listUrl,
          date,
          source.detailUrlSlug
        );

        if (!hasDetailTable(html)) {
          if (isLikelyBlocked(html, false)) {
            throw new Error(BLOCKED_MESSAGE);
          }
          throw new Error(`データテーブルが見つかりません (${dateLabel})`);
        }

        const records = parseAnaSloDetailPage(html, this.hallId, date);
        if (records.length === 0) {
          throw new Error(`台データが0件です (${dateLabel})`);
        }

        return records;
      } catch (error) {
        const shouldRetry = attempt === 0 && isBrowserClosedError(error);
        if (shouldRetry) {
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
      blockedMessage: BLOCKED_MESSAGE,
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
  }
}
