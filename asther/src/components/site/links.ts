// Shared by the client header and the server footer, so it must not live in
// a "use client" module (its exports become client references on the server).
export const SITE_LINKS = [
  ["/fitur", "Fitur"],
  ["/cara-kerja", "Cara kerja"],
  ["/tentang", "Tentang"],
  ["/faq", "FAQ"],
] as const;
