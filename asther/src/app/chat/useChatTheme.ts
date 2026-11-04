"use client";
import { useSyncExternalStore } from "react";
function subscribe(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  window.addEventListener("storage", callback);
  return () => {
    observer.disconnect();
    window.removeEventListener("storage", callback);
  };
}
export function useChatTheme() {
  const dark = useSyncExternalStore(
    subscribe,
    () => document.documentElement.classList.contains("dark"),
    () => false,
  );
  function toggle() {
    document.documentElement.classList.toggle("dark", !dark);
    try {
      localStorage.setItem("theme", dark ? "light" : "dark");
    } catch {
      /* Private browsing may disable persistent preferences. */
    }
  }
  return { dark, toggle };
}
