import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4">
      <div className="max-w-lg rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">Rakuenn</p>
        <h1 className="mt-2 text-3xl font-semibold text-zinc-900">パチスロ店舗データ基盤</h1>
        <p className="mt-3 text-sm text-zinc-600">
          楽園柏店のデータ収集・蓄積・分析のためのMVPです。
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/admin"
            className="rounded-md bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700"
          >
            管理画面
          </Link>
          <Link
            href="/dashboard"
            className="rounded-md border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            ダッシュボード
          </Link>
        </div>
      </div>
    </main>
  );
}
