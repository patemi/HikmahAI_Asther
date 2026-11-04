"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import BrandLogo from "@/components/BrandLogo";
import Icon from "./Icon";
import { SITE_LINKS } from "./links";

export default function SiteHeader() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [openedAt, setOpenedAt] = useState(path);
  // Close the mobile menu after navigating, without an effect-driven reset.
  if (open && openedAt !== path) setOpen(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="sticky top-3 z-40 px-3 sm:top-4">
      <nav
        aria-label="Navigasi utama"
        className="mx-auto max-w-6xl rounded-[28px] border border-stone-900/10 bg-stone-50/80 shadow-[0_10px_30px_-18px_rgba(32,30,29,0.45)] backdrop-blur-md"
      >
        <div className="flex items-center gap-4 py-2 pr-2 pl-5">
          <Link href="/" aria-label="Hikmah AI, beranda" className="mr-auto">
            <BrandLogo size={28} wordmarkClassName="text-[20px]" />
          </Link>
          <div className="hidden items-center gap-1 text-sm font-semibold md:flex">
            {SITE_LINKS.map(([href, label]) => {
              const active = path.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={
                    "rounded-full px-3.5 py-2 transition-colors " +
                    (active
                      ? "bg-hijau/10 text-brand dark:bg-pucuk/15"
                      : "hover:bg-stone-900/5 hover:text-brand")
                  }
                >
                  {label}
                </Link>
              );
            })}
          </div>
          <Link
            href="/chat"
            className="press hidden items-center gap-2.5 rounded-full bg-primary px-5 py-2.5 text-sm font-extrabold text-on-primary hover:bg-primary-hover sm:inline-flex"
          >
            Mulai bertanya
            <Icon name="arrow" size={16} />
          </Link>
          <button
            type="button"
            className="flex size-10 items-center justify-center rounded-full text-stone-900 hover:bg-stone-900/5 md:hidden"
            aria-expanded={open}
            aria-controls="menu-situs"
            aria-label={open ? "Tutup menu" : "Buka menu"}
            onClick={() => {
              setOpen(!open);
              setOpenedAt(path);
            }}
          >
            <Icon name={open ? "close" : "menu"} size={20} />
          </button>
        </div>
        {open && (
          <div
            id="menu-situs"
            className="stagger-in grid gap-1 border-t border-stone-900/10 p-3 md:hidden"
          >
            {SITE_LINKS.map(([href, label]) => (
              <Link
                key={href}
                href={href}
                aria-current={path.startsWith(href) ? "page" : undefined}
                className="rounded-2xl px-4 py-3 text-base font-bold hover:bg-stone-900/5 aria-[current=page]:bg-hijau/10 aria-[current=page]:text-brand"
              >
                {label}
              </Link>
            ))}
            <Link
              href="/chat"
              className="mt-1 flex items-center justify-between rounded-2xl bg-primary px-4 py-3 text-base font-extrabold text-on-primary"
            >
              Mulai bertanya
              <Icon name="arrow" size={18} />
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}
