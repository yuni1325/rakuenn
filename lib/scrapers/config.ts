export const SCRAPE_CONFIG = {
  /** 日付ごとの待機時間（ミリ秒） */
  delayBetweenDatesMs: Number(process.env.SCRAPE_DELAY_MS ?? 5000),
  /** 1回の実行で取得できる最大日数 */
  maxDaysPerRun: Number(process.env.SCRAPE_MAX_DAYS ?? 31),
  /** 連続失敗がこの回数に達したら中断 */
  maxConsecutiveFailures: Number(process.env.SCRAPE_MAX_CONSECUTIVE_FAILURES ?? 3),
  /** この日数ごとにブラウザセッションを再作成 */
  sessionRefreshEvery: Number(process.env.SCRAPE_SESSION_REFRESH_EVERY ?? 15),
  /** ブロック検知後のクールダウン（ミリ秒） */
  cooldownAfterBlockMs: Number(process.env.SCRAPE_COOLDOWN_MS ?? 30000),
} as const;
