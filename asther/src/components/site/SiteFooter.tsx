import Link from "next/link";
import { BrandSymbol, Wordmark } from "@/components/BrandLogo";
import { SITE_LINKS } from "./links";

export default function SiteFooter() {
  return (
    <footer className="px-3 pt-3 pb-3">
      <div className="mx-auto grid max-w-[1400px] gap-10 rounded-[40px] bg-hijau-900 px-6 py-12 text-kertas sm:px-12 md:grid-cols-[1.4fr_1fr_1fr] lg:px-16">
        <div className="flex flex-col gap-4">
          <span className="inline-flex items-center gap-3">
            <BrandSymbol tone="malam" size={36} />
            <Wordmark tone="malam" className="text-3xl" />
          </span>
          <p className="max-w-sm text-sm leading-relaxed text-[#A6CDB5]">
            Teman belajar Hukum Islam, Sejarah Islam, dan Pengetahuan Umum
            Islam. Hikmah AI dapat keliru: periksa rujukannya, dan untuk kasus
            pribadi tanyakan ke ustadz yang kamu percaya.
          </p>
        </div>
        <div className="flex flex-col gap-3 text-sm">
          <span className="label-caps text-pucuk">Jelajahi</span>
          {[["/", "Beranda"], ...SITE_LINKS].map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className="w-fit text-kertas/90 transition-colors hover:text-pucuk"
            >
              {label}
            </Link>
          ))}
        </div>
        <div className="flex flex-col gap-3 text-sm">
          <span className="label-caps text-pucuk">Mulai</span>
          <Link href="/chat" className="w-fit text-kertas/90 hover:text-pucuk">
            Buka chat
          </Link>
          <Link href="/privacy" className="w-fit text-kertas/90 hover:text-pucuk">
            Privasi percakapan
          </Link>
          <Link href="/login" className="w-fit text-kertas/90 hover:text-pucuk">
            Masuk pengelola
          </Link>
        </div>
        <div className="flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-[#A6CDB5] sm:flex-row sm:justify-between md:col-span-3">
          <span>© 2026 Hikmah AI</span>
          <span>Kalem · Cerdas · Hangat · Berdalil</span>
        </div>
      </div>
    </footer>
  );
}
