"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

// One observer for every [data-reveal] element on the page. Each element is
// revealed once and then released, so scrolling costs nothing afterwards.
// It re-runs per route because the marketing layout stays mounted.
export default function Reveal() {
  const path = usePathname();
  useEffect(() => {
    const targets = document.querySelectorAll<HTMLElement>(
      "[data-reveal]:not(.is-visible)",
    );
    if (!("IntersectionObserver" in window)) {
      targets.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [path]);
  return null;
}
