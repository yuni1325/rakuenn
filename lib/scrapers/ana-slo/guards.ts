import { anaSloSelectors } from "./selectors";

export function isCloudflareChallengeHtml(html: string): boolean {
  const lower = html.toLowerCase();
  return anaSloSelectors.cloudflareBlockedTitles.some((title) =>
    lower.includes(title.toLowerCase())
  );
}

export function isLikelyBlocked(html: string, hasTable: boolean): boolean {
  if (hasTable) return false;
  if (isCloudflareChallengeHtml(html)) return true;
  // 本文がほぼ空 = ブロックまたは読み込み失敗
  const textLength = html.replace(/<[^>]+>/g, "").trim().length;
  return textLength < 200;
}

export const BLOCKED_MESSAGE =
  "サイト側（Cloudflare）によりアクセスが一時制限されています。30分〜1時間ほど待ってから、期間を短く（7〜14日程度）分けて再実行してください。";
