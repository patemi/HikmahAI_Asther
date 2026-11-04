import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import Icon from "./Icon";

// Stagger index for [data-reveal] and .pop-in elements.
export const delay = (d: number) => ({ "--d": d }) as CSSProperties;

export function Eyebrow({
  children,
  tone = "light",
}: {
  children: ReactNode;
  tone?: "light" | "dark";
}) {
  return (
    <span
      className={
        "label-caps w-fit rounded-full px-3 py-1 " +
        (tone === "dark"
          ? "bg-pucuk/15 text-pucuk"
          : "bg-hijau/10 text-brand dark:bg-pucuk/15")
      }
    >
      {children}
    </span>
  );
}

export function SectionHead({
  eyebrow,
  title,
  lead,
}: {
  eyebrow: string;
  title: string;
  lead?: string;
}) {
  return (
    <div
      data-reveal
      className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-10"
    >
      <div className="flex flex-col gap-3">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 className="font-display text-4xl leading-[0.95] text-stone-900 sm:text-5xl">
          {title}
        </h2>
      </div>
      {lead && (
        <p className="max-w-md text-[15px] leading-relaxed text-stone-600">
          {lead}
        </p>
      )}
    </div>
  );
}

// Inner-page hero: Malam panel with a soft glow and a staggered entrance.
export function PageHero({
  eyebrow,
  title,
  lead,
  children,
}: {
  eyebrow: string;
  title: string;
  lead: string;
  children?: ReactNode;
}) {
  return (
    <section className="px-3 pt-4 sm:pt-6">
      <div className="relative mx-auto max-w-[1400px] overflow-hidden rounded-[36px] bg-hijau-900 px-6 py-14 text-kertas sm:px-12 sm:py-20 lg:px-16">
        <div
          aria-hidden
          className="drift-slow pointer-events-none absolute -top-32 -right-24 size-[28rem] rounded-full bg-[radial-gradient(circle,rgba(197,236,79,0.2),transparent_65%)]"
        />
        <span
          aria-hidden
          className="brand-symbol float-slow pointer-events-none absolute -right-10 -bottom-16 hidden size-72 bg-pucuk/10 lg:block"
        />
        <div className="stagger-in relative flex max-w-3xl flex-col gap-6">
          <Eyebrow tone="dark">{eyebrow}</Eyebrow>
          <h1 className="font-display text-[clamp(40px,6.5vw,84px)] leading-[0.92]">
            {title}
          </h1>
          <p className="max-w-2xl text-[clamp(17px,1.6vw,20px)] leading-relaxed text-[#CFE4D7]">
            {lead}
          </p>
          {children}
        </div>
      </div>
    </section>
  );
}

export function CtaBand({
  eyebrow = "Siap mulai?",
  title,
  body,
}: {
  eyebrow?: string;
  title: string;
  body?: string;
}) {
  return (
    <section className="px-3 pt-3">
      <div className="relative mx-auto flex max-w-[1400px] flex-col items-start gap-8 overflow-hidden rounded-[40px] bg-hijau px-6 py-16 text-kertas sm:px-12 sm:py-20 lg:flex-row lg:items-end lg:justify-between lg:px-16">
        <div
          aria-hidden
          className="drift-slow pointer-events-none absolute -bottom-32 -left-20 size-96 rounded-full bg-[radial-gradient(circle,rgba(197,236,79,0.25),transparent_65%)]"
        />
        <div data-reveal className="relative flex flex-col gap-4">
          <span className="label-caps w-fit rounded-full bg-pucuk px-3 py-1 text-hijau-900">
            {eyebrow}
          </span>
          <p className="font-display max-w-[18ch] text-[clamp(34px,5vw,60px)] leading-[0.95]">
            {title}
          </p>
          {body && (
            <p className="max-w-xl text-[16px] leading-relaxed text-[#CFE4D7]">
              {body}
            </p>
          )}
        </div>
        <div data-reveal style={delay(2)} className="relative flex flex-col gap-2 sm:flex-row">
          <Link
            href="/chat"
            className="press inline-flex items-center justify-between gap-10 rounded-full bg-pucuk px-7 py-4 text-base font-extrabold text-hijau-900 hover:bg-[#D4F27A]"
          >
            Mulai bertanya
            <Icon name="arrow" size={18} />
          </Link>
          <Link
            href="/fitur"
            className="press inline-flex items-center justify-center rounded-full border-2 border-kertas/60 px-7 py-[14px] text-base font-extrabold hover:border-kertas hover:bg-kertas hover:text-hijau-900"
          >
            Lihat fitur
          </Link>
        </div>
      </div>
    </section>
  );
}

export function PrimaryCta({ children = "Mulai bertanya" }: { children?: ReactNode }) {
  return (
    <Link
      href="/chat"
      className="press inline-flex w-fit items-center justify-between gap-8 rounded-full bg-pucuk px-6 py-4 text-[15px] font-extrabold text-hijau-900 hover:bg-[#D4F27A]"
    >
      {children}
      <Icon name="arrowUpRight" size={18} />
    </Link>
  );
}
