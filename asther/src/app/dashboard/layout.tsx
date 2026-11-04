import Link from "next/link";
import { requireAdminPage } from "@/lib/auth";
import BrandLogo from "@/components/BrandLogo";
import ThemeToggle from "./ThemeToggle";
import DashboardNav from "./DashboardNav";
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdminPage();
  return (
    <div className="min-h-dvh bg-stone-50">
      <header className="sticky top-0 z-30 px-3 pt-3">
        <div className="mx-auto max-w-6xl rounded-[28px] border border-stone-900/10 bg-stone-50/85 px-4 pt-3 pb-2 shadow-[0_12px_32px_-22px_rgba(32,30,29,0.5)] backdrop-blur-md sm:px-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/dashboard"
              className="flex items-center gap-3"
              aria-label="Hikmah AI, ringkasan pengelola"
            >
              <BrandLogo size={28} wordmarkClassName="text-xl" />
              <span className="label-caps rounded-full bg-stone-900 px-2.5 py-1 text-[10px] text-stone-50">
                Pengelola
              </span>
            </Link>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link
                href="/dashboard/settings"
                className="flex max-w-48 items-center gap-2 rounded-full py-1 pr-3 pl-1 text-sm font-semibold text-stone-700 transition-colors hover:bg-stone-900/5"
              >
                <span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-extrabold text-on-primary">
                  {(user.name || user.email).slice(0, 1).toUpperCase()}
                </span>
                <span className="truncate">{user.name || user.email}</span>
              </Link>
              <form action="/api/auth/logout" method="POST">
                <button className="rounded-full border border-stone-900/15 px-4 py-1.5 text-sm font-bold text-stone-900 hover:border-stone-900 hover:bg-stone-900 hover:text-stone-50">
                  Keluar
                </button>
              </form>
            </div>
          </div>
          <div className="mt-2">
            <DashboardNav />
          </div>
        </div>
      </header>
      <main className="dash mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
