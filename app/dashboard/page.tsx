"use client";

import { useCallback, useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { HALL_OPTIONS } from "@/lib/halls";

type SlotRecord = {
  id: number;
  machineNo: string;
  machineName: string;
  bbCount: number | null;
  rbCount: number | null;
  totalGames: number | null;
  diffMedals: number | null;
};

type Summary = {
  totalMachines: number;
  averageDiff: number;
  plusRatio: number;
  totalDiff: number;
};

type SortKey = "machineNo" | "machineName" | "bbCount" | "rbCount" | "totalGames" | "diffMedals";

function formatNumber(value: number | null): string {
  if (value === null) return "-";
  return value.toLocaleString("ja-JP");
}

export default function DashboardPage() {
  const [hallId, setHallId] = useState("rakuen_kashiwa");
  const [date, setDate] = useState("2026-06-17");
  const [sortBy, setSortBy] = useState<SortKey>("machineNo");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [records, setRecords] = useState<SlotRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ hallId, date, sortBy, sortOrder });
      const response = await fetch(`/api/slot-data?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "データの取得に失敗しました");
      }

      setSummary(data.summary);
      setRecords(data.records);
    } catch (err) {
      setError(err instanceof Error ? err.message : "データの取得に失敗しました");
      setSummary(null);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [hallId, date, sortBy, sortOrder]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function handleSort(column: SortKey) {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortBy(column);
    setSortOrder("asc");
  }

  function sortIndicator(column: SortKey) {
    if (sortBy !== column) return "";
    return sortOrder === "asc" ? " ↑" : " ↓";
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <AppHeader title="ダッシュボード" />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <section className="mb-6 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-zinc-700">店舗</span>
              <select
                value={hallId}
                onChange={(e) => setHallId(e.target.value)}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
              >
                {HALL_OPTIONS.map((hall) => (
                  <option key={hall.id} value={hall.id}>
                    {hall.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-zinc-700">日付</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
              />
            </label>
            <div className="flex items-end">
              <button
                type="button"
                onClick={loadData}
                className="w-full rounded-md border border-zinc-300 px-4 py-2.5 text-sm hover:bg-zinc-50 sm:py-2"
              >
                再読み込み
              </button>
            </div>
          </div>
        </section>

        {loading && <p className="text-sm text-zinc-600">読み込み中...</p>}
        {error && (
          <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </p>
        )}

        {summary && (
          <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "総台数", value: `${summary.totalMachines}台` },
              { label: "平均差枚", value: formatNumber(summary.averageDiff) },
              { label: "プラス台割合", value: `${summary.plusRatio}%` },
              { label: "総差枚", value: formatNumber(summary.totalDiff) },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
              >
                <p className="text-sm text-zinc-500">{item.label}</p>
                <p className="mt-1 text-2xl font-semibold text-zinc-900">{item.value}</p>
              </div>
            ))}
          </section>
        )}

        <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-zinc-100 text-left text-zinc-700">
                <tr>
                  {[
                    ["machineNo", "台番号"],
                    ["machineName", "機種名"],
                    ["bbCount", "BB"],
                    ["rbCount", "RB"],
                    ["totalGames", "総回転数"],
                    ["diffMedals", "差枚"],
                  ].map(([key, label]) => (
                    <th key={key} className="px-4 py-3 font-medium">
                      <button type="button" onClick={() => handleSort(key as SortKey)}>
                        {label}
                        {sortIndicator(key as SortKey)}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id} className="border-t border-zinc-100">
                    <td className="px-4 py-3">{record.machineNo}</td>
                    <td className="px-4 py-3">{record.machineName}</td>
                    <td className="px-4 py-3">{formatNumber(record.bbCount)}</td>
                    <td className="px-4 py-3">{formatNumber(record.rbCount)}</td>
                    <td className="px-4 py-3">{formatNumber(record.totalGames)}</td>
                    <td className="px-4 py-3">{formatNumber(record.diffMedals)}</td>
                  </tr>
                ))}
                {!loading && records.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                      データがありません
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
