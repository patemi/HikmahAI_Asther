import { clsx } from "clsx";

type Tone = "auto" | "kertas" | "malam" | "pucuk";

// Full-color symbol is allowed only on Kertas; every other ground gets the
// single-color mask version (guideline 2.0, Logo rules).
export function BrandSymbol({
  size = 32,
  tone = "auto",
  className,
}: {
  size?: number;
  tone?: Tone;
  className?: string;
}) {
  const box = { width: size, height: size };
  const color = (
    <span
      aria-hidden
      style={{
        ...box,
        background: "url(/brand/symbol.png) center / contain no-repeat",
      }}
      className={clsx("block shrink-0", tone === "auto" && "dark:hidden")}
    />
  );
  const mono = (fill: string, extra?: string) => (
    <span
      aria-hidden
      style={box}
      className={clsx("brand-symbol block shrink-0", fill, extra)}
    />
  );
  if (tone === "kertas") return <span className={className}>{color}</span>;
  if (tone === "malam") return <span className={className}>{mono("bg-pucuk")}</span>;
  if (tone === "pucuk")
    return <span className={className}>{mono("bg-hijau-900")}</span>;
  return (
    <span className={className}>
      {color}
      {mono("bg-pucuk", "hidden dark:block")}
    </span>
  );
}

export function Wordmark({
  className,
  tone = "auto",
}: {
  className?: string;
  tone?: Tone;
}) {
  return (
    <span
      className={clsx(
        "font-display leading-none",
        tone === "kertas" && "text-hijau",
        tone === "malam" && "text-kertas",
        tone === "pucuk" && "text-hijau-900",
        tone === "auto" && "text-hijau dark:text-kertas",
        className,
      )}
    >
      Hikmah
      <span
        className={clsx(
          "ml-[0.1em] font-light tracking-[-0.03em]",
          tone === "kertas" && "text-[#A67E2C]",
          tone === "malam" && "text-emas-muda",
          tone === "auto" && "text-[#A67E2C] dark:text-emas-muda",
        )}
      >
        AI
      </span>
    </span>
  );
}

export default function BrandLogo({
  size = 28,
  tone = "auto",
  className,
  wordmarkClassName,
}: {
  size?: number;
  tone?: Tone;
  className?: string;
  wordmarkClassName?: string;
}) {
  return (
    <span className={clsx("inline-flex items-center gap-2.5", className)}>
      <BrandSymbol size={size} tone={tone} />
      <Wordmark
        tone={tone}
        className={wordmarkClassName}
      />
    </span>
  );
}
