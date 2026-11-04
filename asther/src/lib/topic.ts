import { chatCompletion, getChatModelFallbackList } from "@/lib/openai";
const QURAN_QUERY_REGEX =
  /(qur'?an|al[-\s]?qur'?an|alqur'?an|tafsir|ayat|surah|\bqs\b)/i;
const ISLAMIC_QUERY_REGEX =
  /(islam|fiqh|fikih|aqidah|tauhid|syariah|syariat|halal|haram|sunnah|zakat|shalat|salat|puasa|haji|umrah|nikah|talak|waris|qur'?an|hadits?|hadis|tafsir|ayat|surah|sirah|sejarah\s+islam|nabi|rasul|sahabat|tabiin|tabi'?\s*tabiin|ulama|khalifah|khilafah|khulafa|rasyidin|dinasti\s+umayyah|dinasti\s+abbasiyah|utsmani|ottoman|mamluk|ayyubiyah|fatimiyah|andarus|pahlawan\s+islam|tokoh\s+islam)/i;
const CLEARLY_NON_ISLAMIC_REGEX =
  /(javascript|typescript|next\.?js|react|node\.?js|python|java\b|golang|pemrograman|koding|coding|debug|bug|saham|crypto|bitcoin|trading|forex|sepak\s?bola|football|basket|anime|film|drama|musik\s+pop|marketing|iklan|seo|jualan\s+online|casino|judi|slot|zodiak)/i;
const ISLAMIC_CONTEXT_EXTRA_REGEX =
  /(sya'?i|sa'i|sai\b|thawaf|tawaf|ihram|miqat|wukuf|jamrah|talbiyah|rukun\s+haji|rukun\s+umrah|umrah|haji\s+tamattu|haji\s+qiran|haji\s+ifrad|fatwa|ustadz|ustaz|kyai|kiai|dalil|ijma|qiyas|mazhab|madzhab|ibadah|muamalah|adab|akhlak|syar'?i)/i;
const FOLLOW_UP_REFERENCE_REGEX =
  /(itu|tersebut|yang\s+tadi|yang\s+sebelumnya|kasus\s+itu|kondisi\s+itu|dalam\s+kondisi\s+itu|kalau\s+begitu|jika\s+begitu|berarti|lalu|terus|lanjut)/i;
const CONTEXT_STOPWORDS = new Set([
  "yang",
  "dan",
  "atau",
  "di",
  "ke",
  "dari",
  "untuk",
  "dengan",
  "pada",
  "itu",
  "ini",
  "saya",
  "anda",
  "kamu",
  "kami",
  "kita",
  "mereka",
  "adalah",
  "akan",
  "jika",
  "kalau",
  "bagaimana",
  "apakah",
  "seperti",
  "dalam",
  "namun",
  "tetap",
  "sambil",
  "lalu",
  "terus",
]);

type TopicClassificationResult = {
  allowed: boolean;
  reason: string;
};

function hasIslamicSignal(text: string) {
  return (
    ISLAMIC_QUERY_REGEX.test(text) ||
    QURAN_QUERY_REGEX.test(text) ||
    ISLAMIC_CONTEXT_EXTRA_REGEX.test(text)
  );
}

function toMeaningfulTokens(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s']/gu, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 4 && !CONTEXT_STOPWORDS.has(token));
}

function countSharedContextTerms(
  message: string,
  history: Array<{ role: string; content: string }>,
) {
  const messageTerms = new Set(toMeaningfulTokens(message));

  if (messageTerms.size === 0) return 0;

  const historyTerms = new Set(
    toMeaningfulTokens(history.map((item) => item.content).join(" ")),
  );

  let shared = 0;
  for (const term of messageTerms) {
    if (historyTerms.has(term)) {
      shared += 1;
    }
  }

  return shared;
}

function isIslamicFollowUpFromHistory(
  message: string,
  history: Array<{ role: string; content: string }>,
) {
  const recentHistory = history.slice(-6);
  if (recentHistory.length === 0) return false;

  const hasIslamicHistory = recentHistory.some((item) =>
    hasIslamicSignal(item.content),
  );

  if (!hasIslamicHistory) return false;

  const sharedTerms = countSharedContextTerms(message, recentHistory);
  const hasReferenceCue = FOLLOW_UP_REFERENCE_REGEX.test(message.toLowerCase());

  return sharedTerms >= 2 || (hasReferenceCue && sharedTerms >= 1);
}

export function buildIslamicOnlyNotice() {
  return [
    "Maaf, pertanyaan ini di luar topik yang bisa saya bantu.",
    "",
    "Saya fokus di tiga bidang:",
    "- Hukum Islam (fiqh, ibadah, muamalah, adab, akhlak)",
    "- Sejarah Islam (nabi, sahabat, ulama, khalifah, kerajaan/peradaban Islam, tokoh/pahlawan Islam)",
    "- Pengetahuan umum Islam (aqidah, Al-Qur'an, hadits, tafsir, sirah)",
    "",
    "Coba tanyakan lagi dengan sudut pandang keislaman, nanti saya bantu.",
  ].join("\n");
}

function parseClassificationJson(
  raw: string,
): TopicClassificationResult | null {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced?.[1] || trimmed).trim();
  const objectMatch = candidate.match(/\{[\s\S]*\}/);

  if (!objectMatch) return null;

  try {
    const parsed = JSON.parse(objectMatch[0]) as {
      allowed?: unknown;
      reason?: unknown;
    };

    return {
      allowed: parsed.allowed === true,
      reason:
        typeof parsed.reason === "string" && parsed.reason.trim()
          ? parsed.reason.trim()
          : "Topik tidak termasuk ruang lingkup keislaman.",
    };
  } catch {
    return null;
  }
}

export async function classifyIslamicTopicStrict(params: {
  message: string;
  history: Array<{ role: string; content: string }>;
  preferredModel?: string;
}): Promise<TopicClassificationResult> {
  const { message, history, preferredModel } = params;
  const normalizedMessage = message.trim();

  if (!normalizedMessage) {
    return {
      allowed: false,
      reason: "Pesan kosong tidak bisa diklasifikasikan.",
    };
  }

  if (
    hasIslamicSignal(normalizedMessage) &&
    !CLEARLY_NON_ISLAMIC_REGEX.test(normalizedMessage)
  ) {
    return {
      allowed: true,
      reason: "Terdeteksi kata kunci keislaman.",
    };
  }

  if (
    CLEARLY_NON_ISLAMIC_REGEX.test(normalizedMessage) &&
    !hasIslamicSignal(normalizedMessage)
  ) {
    return {
      allowed: false,
      reason: "Terdeteksi topik non-keislaman.",
    };
  }

  if (isIslamicFollowUpFromHistory(normalizedMessage, history)) {
    return {
      allowed: true,
      reason:
        "Follow-up masih berada dalam konteks keislaman dari riwayat percakapan.",
    };
  }

  const clippedHistory = history
    .slice(-6)
    .map((item) => `${item.role}: ${item.content.slice(0, 500)}`)
    .join("\n");

  const classifierMessages: Array<{
    role: "system" | "user";
    content: string;
  }> = [
    {
      role: "system",
      content: `Anda adalah classifier topik yang SANGAT ketat.

Klasifikasikan apakah pesan user TERMASUK topik yang diizinkan berikut:
1) Hukum Islam (fiqh, ibadah, muamalah, akhlak, adab)
2) Sejarah Islam (para nabi/rasul, sahabat, ulama, khalifah, kerajaan/peradaban Islam, tokoh/pahlawan Islam)
3) Pengetahuan umum Islam (aqidah, Al-Qur'an, hadits, tafsir, sirah)

Semua topik di luar ruang lingkup di atas harus ditandai TIDAK DIIZINKAN.
Jika pesan berupa follow-up singkat, gunakan riwayat untuk menentukan konteks.

Output HARUS JSON valid saja tanpa teks lain, format:
{"allowed": true|false, "reason": "..."}`,
    },
    {
      role: "user",
      content: `Riwayat (bisa kosong):\n${clippedHistory || "(kosong)"}\n\nPesan saat ini:\n${normalizedMessage}`,
    },
  ];

  const modelCandidates = getChatModelFallbackList(preferredModel);

  for (const model of modelCandidates) {
    try {
      const completion = await chatCompletion(classifierMessages, {
        model,
        temperature: 0,
        maxTokens: 160,
        purpose: "classification",
      });

      const content = completion.choices?.[0]?.message?.content;
      if (typeof content !== "string" || !content.trim()) {
        continue;
      }

      const parsed = parseClassificationJson(content);
      if (parsed) {
        return parsed;
      }
    } catch (error) {
      console.warn("[TopicGuard] Classification unavailable", {
        model,
        error: error instanceof Error ? error.name : "Unknown",
      });
    }
  }

  return {
    allowed: false,
    reason: "Topik tidak bisa diverifikasi sebagai topik keislaman.",
  };
}
