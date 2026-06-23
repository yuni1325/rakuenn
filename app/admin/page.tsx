"use client";

import { useMemo, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { HALL_OPTIONS } from "@/lib/halls";
import { DATA_SOURCE_OPTIONS } from "@/types/data-source";
import type { DataSourceId } from "@/types/data-source";
import type { FetchProgressEvent, FetchResult } from "@/types/slot";

const MAX_DAYS_PER_RUN = 31;

type ProgressItem = {
  date: string;
  status: "completed" | "failed";
  message?: string;
};

function countDays(start: string, end: string): number {
  const startMs = Date.parse(`${start}T00:00:00Z`);
  const endMs = Date.parse(`${end}T00:00:00Z`);
  if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs < startMs) return 0;
  return Math.floor((endMs - startMs) / (1000 * 60 * 60 * 24)) + 1;
}

export default function AdminPage() {
  const [hallId, setHallId] = useState("rakuen_kashiwa");
  const [dataSource, setDataSource] = useState<DataSourceId>("min_repo");
  const [startDate, setStartDate] = useState("2026-06-01");
  const [endDate, setEndDate] = useState("2026-06-07");
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState<ProgressItem[]>([]);
  const [result, setResult] = useState<FetchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [abortReason, setAbortReason] = useState<string | null>(null);

  const dayCount = useMemo(() => countDays(startDate, endDate), [startDate, endDate]);
  const isRangeTooLong = dayCount > MAX_DAYS_PER_RUN;

  async function handleFetch() {
    if (isRangeTooLong) {
      setError(`一度に取得できるのは最大${MAX_DAYS_PER_RUN}日です（指定: ${dayCount}日）`);
      return;
    }

    setIsRunning(true);
    setProgress([]);
    setResult(null);
    setError(null);
    setAbortReason(null);

    try {
      const response = await fetch("/api/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hallId, dataSource, startDate, endDate, stream: true }),
      });

      if (!response.ok || !response.body) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "データ取得に失敗しました");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line) as FetchProgressEvent | { type: "error"; message: string };

          if (event.type === "progress") {
            setProgress((prev) => [...prev, { date: event.date, status: event.status, message: event.message }]);
          } else if (event.type === "aborted") {
            setAbortReason(event.reason);
          } else if (event.type === "complete") {
            setResult(event.result);
          } else if (event.type === "error") {
            setError(event.message);
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "データ取得に失敗しました");
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <AppHeader title="管理画面" />
      <main className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
        <section className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-medium">アクセス制限について</p>
          <p className="mt-1">
            アナスロは Cloudflare により連続アクセスを制限されます。みんレポは比較的安定していますが、どちらも1回あたり<strong>最大{MAX_DAYS_PER_RUN}日</strong>まで、
            日付ごとに約5秒の間隔を空けて取得してください。Bot検知回避のステルス設定は既定で有効です（`PLAYWRIGHT_STEALTH=false` で無効化）。
          </p>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="mb-6 text-lg font-semibold text-zinc-900">データ取得</h2>

          <div className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-zinc-700">データソース</span>
              <select
                value={dataSource}
                onChange={(e) => setDataSource(e.target.value as DataSourceId)}
                disabled={isRunning}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
              >
                {DATA_SOURCE_OPTIONS.map((source) => (
                  <option key={source.id} value={source.id}>
                    {source.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-zinc-700">店舗</span>
              <select
                value={hallId}
                onChange={(e) => setHallId(e.target.value)}
                disabled={isRunning}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
              >
                {HALL_OPTIONS.map((hall) => (
                  <option key={hall.id} value={hall.id}>
                    {hall.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-zinc-700">開始日</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={isRunning}
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-zinc-700">終了日</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={isRunning}
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                />
              </label>
            </div>

            <p className={`text-sm ${isRangeTooLong ? "text-red-600" : "text-zinc-500"}`}>
              取得日数: {dayCount}日 {isRangeTooLong && `（最大${MAX_DAYS_PER_RUN}日を超えています）`}
            </p>
            {dataSource === "ana_slo" && (
              <p className="text-xs text-zinc-500">
                アナスロは広告をブロックし、日付リンクのクリックではなく同一タブ内の遷移で詳細ページを開きます。`PLAYWRIGHT_HEADLESS=false` 推奨。
              </p>
            )}
            {dataSource === "min_repo" && (
              <p className="text-xs text-zinc-500">
                みんレポは全台データ（?kishu=all）のみ取得します。BB/RB は取得しません。
              </p>
            )}
            <p className="text-xs text-zinc-500">
              クラウドではヘッドレス（画面なし）で取得します。ローカル開発時は `PLAYWRIGHT_HEADLESS=false` でブラウザ表示できます。
            </p>

            <button
              type="button"
              onClick={handleFetch}
              disabled={isRunning || isRangeTooLong}
              className="w-full rounded-md bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:py-2"
            >
              {isRunning ? "処理中..." : "データ取得開始"}
            </button>
          </div>
        </section>

        {(isRunning || progress.length > 0) && (
          <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-base font-semibold text-zinc-900">
              {isRunning ? "処理中..." : "処理完了"}
            </h3>
            <ul className="space-y-2 text-sm">
              {progress.map((item) => (
                <li
                  key={item.date}
                  className={item.status === "failed" ? "text-red-600" : "text-zinc-700"}
                >
                  {item.date} {item.status === "completed" ? "完了" : `失敗: ${item.message}`}
                </li>
              ))}
            </ul>
          </section>
        )}

        {abortReason && (
          <section className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-medium">取得を中断しました</p>
            <p className="mt-1">{abortReason}</p>
            <p className="mt-2">成功した日付のデータは保存済みです。ダッシュボードで確認できます。</p>
          </section>
        )}

        {result && (
          <section className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-6">
            <h3 className="mb-4 text-base font-semibold text-emerald-900">取得結果</h3>
            <dl className="grid gap-2 text-sm text-emerald-900 sm:grid-cols-2">
              <div>取得日数：{result.days}日</div>
              <div>取得レコード数：{result.records}件</div>
              <div>成功：{result.successCount}</div>
              <div>失敗：{result.failureCount}</div>
              {result.aborted && <div className="sm:col-span-2 text-amber-800">※途中で中断されました</div>}
            </dl>
          </section>
        )}

        {error && (
          <section className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </section>
        )}
      </main>
    </div>
  );
}
