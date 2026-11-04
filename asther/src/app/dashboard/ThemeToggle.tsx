"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialDark = saved ? saved === "dark" : prefersDark;

    document.documentElement.classList.toggle("dark", initialDark);
    requestAnimationFrame(() => {
      setIsDark(initialDark);
      setMounted(true);
    });
  }, []);

  function toggleTheme() {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem("theme", next ? "dark" : "light");
    document.documentElement.classList.toggle("dark", next);
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="wiggle-hover rounded-full border border-stone-900/15 p-2 text-stone-900 hover:border-stone-900 hover:bg-stone-900 hover:text-stone-50"
      aria-label={mounted && isDark ? "Pakai tema terang" : "Pakai tema gelap"}
      suppressHydrationWarning
    >
      {mounted && isDark ? (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path
            strokeLinecap="square"
            strokeLinejoin="miter"
            strokeWidth={2.2}
            d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364-6.364-1.414 1.414M7.05 16.95l-1.414 1.414M18.364 18.364l-1.414-1.414M7.05 7.05 5.636 5.636M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ) : (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path
            strokeLinecap="square"
            strokeLinejoin="miter"
            strokeWidth={2.2}
            d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
          />
        </svg>
      )}
    </button>
  );
}
