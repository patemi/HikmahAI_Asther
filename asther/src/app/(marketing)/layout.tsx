import Reveal from "@/components/Reveal";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";

// Shared shell for the public pages: floating nav, footer, scroll reveal.
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh overflow-x-clip bg-stone-50 text-stone-900">
      <Reveal />
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}
