import type { ChatHistory } from "@/lib/answers";

export function conversationalReply(message: string): string | null {
  const text = message
    .toLowerCase()
    .replace(/[.!?,\s]+$/g, "")
    .trim();
  if (
    /^(ass?alamu'?alaikum|ass?alamualaikum)(\s+(wr\.?\s*wb\.?|warahmatullahi(\s+wabarakatuh)?))?$/.test(
      text,
    )
  ) {
    return "Waalaikumsalam warahmatullahi wabarakatuh. Mau tanya apa soal Islam hari ini?";
  }
  if (/^(halo|hai|hi|salam|selamat (pagi|siang|sore|malam))$/.test(text))
    return "Assalamualaikum. Saya Hikmah AI, teman belajar seputar Islam. Kamu bisa tanya soal ibadah, Al-Qur'an, akhlak, atau sejarah Islam. Mau mulai dari mana?";
  if (/^(terima kasih|makasih|syukran|jazakallah(\s+khair(an)?)?)$/.test(text))
    return "Sama-sama. Semoga bermanfaat. Kalau ada bagian yang mau dibahas lagi, tanya aja.";
  if (
    /^(siapa (kamu|anda)|apa (itu )?hikmah\s?ai|apa yang bisa (kamu|anda) (bantu|lakukan))$/.test(
      text,
    )
  )
    return "Saya Hikmah AI, teman belajar untuk Hukum Islam, Sejarah Islam, dan Pengetahuan Umum Islam. Setiap jawaban saya sertai rujukan dari sumber yang ditinjau pengelola. Kalau ragu, saya bilang ragu. Mau mulai dari mana?";
  return null;
}

export function retrievalQuestion(
  message: string,
  history: ChatHistory,
): string {
  const followUp =
    /^(jelaskan (lagi|lebih)|lebih (detail|rinci|lanjut)|beri(kan)? contoh|contoh(nya)?|bagaimana (contoh|dengan itu|penerapannya)|kenapa (begitu|demikian)|mengapa (begitu|demikian)|lanjut(kan)?|apa maksud(nya)?|maksudnya|ringkas(kan)?)/i;
  if (message.length > 160 || !followUp.test(message.trim())) return message;
  const previous = [...history]
    .reverse()
    .find(
      (item) =>
        item.role === "user" &&
        !followUp.test(item.content.trim()) &&
        !conversationalReply(item.content),
    );
  return previous?.content.slice(0, 1600) || message;
}
