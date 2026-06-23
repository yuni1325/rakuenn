import Link from "next/link";

const links = [
  { href: "/admin", label: "管理画面" },
  { href: "/dashboard", label: "ダッシュボード" },
];

export function AppHeader({ title }: { title: string }) {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Rakuenn</p>
          <h1 className="text-lg font-semibold text-zinc-900 sm:text-xl">{title}</h1>
        </div>
        <nav className="flex gap-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex-1 rounded-md px-3 py-2.5 text-center text-sm text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 sm:flex-none sm:py-2"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
