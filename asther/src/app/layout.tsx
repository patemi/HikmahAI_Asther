import type { Metadata, Viewport } from "next";
import { Archivo, Amiri_Quran, Noto_Kufi_Arabic } from "next/font/google";
import "./globals.css";

// Archivo variable with the width axis: wdth 118 for display, 100 for reading.
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
});

// Archivo has no Arabic glyphs, so Arabic text in answers (ayat, hadis) falls
// back to a mushaf-style face, as the guideline requires for Qur'anic verses.
const amiriQuran = Amiri_Quran({
  variable: "--font-quran",
  weight: "400",
  subsets: ["arabic"],
  display: "swap",
});

// Kufi is reserved for short decorative terms such as حكمة.
const notoKufi = Noto_Kufi_Arabic({
  variable: "--font-noto-kufi",
  subsets: ["arabic"],
  weight: ["400", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hikmah AI — Tanya apa aja soal Islam",
  description:
    "Hikmah AI, teman belajar Hukum Islam, Sejarah Islam, dan Pengetahuan Umum Islam. Jawabannya ada dalilnya.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "16x16 32x32 48x48", type: "image/x-icon" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F3F2EF" },
    { media: "(prefers-color-scheme: dark)", color: "#062A1B" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${archivo.variable} ${amiriQuran.variable} ${notoKufi.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                document.documentElement.classList.add('js');
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
