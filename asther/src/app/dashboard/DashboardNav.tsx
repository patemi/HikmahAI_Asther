"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
const links = [
  ["/dashboard", "Ringkasan"],
  ["/dashboard/demo", "Demo"],
  ["/dashboard/config", "Konfigurasi"],
  ["/dashboard/knowledge", "Pengetahuan"],
  ["/dashboard/history", "Riwayat"],
  ["/dashboard/api-docs", "API"],
  ["/dashboard/reports", "Laporan"],
  ["/dashboard/usage", "Pemakaian"],
  ["/dashboard/evaluation", "Evaluasi"],
] as const;
export default function DashboardNav() {
  const path = usePathname();
  return (
    <nav
      aria-label="Navigasi pengelola"
      className="-mx-1 flex gap-1 overflow-x-auto px-1 py-1 [scrollbar-width:none]"
    >
      {links.map(([href, label]) => {
        const active =
          href === "/dashboard" ? path === href : path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={
              "press shrink-0 rounded-full px-3.5 py-2 text-sm font-semibold whitespace-nowrap " +
              (active
                ? "bg-primary text-on-primary shadow-[0_6px_16px_-8px_rgba(11,82,50,0.7)]"
                : "text-stone-600 hover:bg-stone-900/5 hover:text-stone-900")
            }
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
