import { describe, test, expect } from "bun:test";
import { rankKnowledge } from "../src/lib/rag-ranking";
import { safeSourceUrl } from "../src/lib/citations";
import {
  documentMetrics,
  mean,
  citationNumbersValid,
} from "../src/lib/evaluation-metrics";
import { parseKnowledgeJson } from "../src/lib/knowledge-input";
import { assertSameOrigin, readJsonRequest, HttpError } from "../src/lib/http";
import {
  conversationalReply,
  retrievalQuestion,
} from "../src/lib/conversation-policy";

describe("Islamic conversational context", () => {
  test("follow-up retrieval keeps the preceding factual topic", () => {
    expect(
      retrievalQuestion("Jelaskan lebih sederhana", [
        { role: "user", content: "Apa perbedaan zakat fitrah dan zakat mal?" },
        { role: "assistant", content: "Penjelasan." },
      ]),
    ).toBe("Apa perbedaan zakat fitrah dan zakat mal?");
    expect(
      retrievalQuestion("Bagaimana tata cara shalat?", [
        { role: "user", content: "zakat" },
      ]),
    ).toBe("Bagaimana tata cara shalat?");
  });
  test("only exact social messages receive a source-free reply", () => {
    expect(conversationalReply("Terima kasih!")).toContain("Sama-sama");
    expect(conversationalReply("Halo, buatkan fatwa tentang waris")).toBeNull();
  });
});
const chunk = {
  id: "one",
  documentTitle: "Tafsir Al-Quran",
  content: "Ayat",
  source: null,
  vectorScore: 0.2,
  keywordScore: 0,
};
describe("source relevance boundaries", () => {
  test("does not return subthreshold sources even for a matching domain", () => {
    expect(rankKnowledge("tafsir", [chunk], 0.7, 5)).toEqual([]);
  });
  test("does not return zero-score keyword fallback", () => {
    expect(
      rankKnowledge("zakat", [{ ...chunk, vectorScore: 0 }], 0.1, 5),
    ).toEqual([]);
  });
  test("merges scores of duplicate chunks without losing the semantic score", () => {
    const rows = rankKnowledge(
      "ayat",
      [
        { ...chunk, vectorScore: 0.8 },
        { ...chunk, vectorScore: 0, keywordScore: 0.7 },
      ],
      0.7,
      5,
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].vectorScore).toBe(0.8);
    expect(rows[0].keywordScore).toBe(0.7);
  });
  test("accepts the exact threshold and respects top K", () => {
    expect(
      rankKnowledge(
        "zakat",
        [
          { ...chunk, vectorScore: 0.7 },
          { ...chunk, id: "two", vectorScore: 0.9 },
        ],
        0.7,
        1,
      )[0].id,
    ).toBe("two");
  });
  test("invalid vector scores never pass", () => {
    expect(rankKnowledge("", [{ ...chunk, vectorScore: NaN }], 0.1, 1)).toEqual(
      [],
    );
  });
});
describe("honest evaluation metrics", () => {
  test("deduplicates documents consistently for both precision and recall", () => {
    expect(documentMetrics(["a", "a", "b"], ["a", "c", "c"])).toEqual({
      precision: 0.5,
      recall: 0.5,
      f1Score: 0.5,
    });
  });
  test("marks retrieval without ground truth as unmeasured", () => {
    expect(documentMetrics(["a"], [])).toEqual({
      precision: null,
      recall: null,
      f1Score: null,
    });
  });
  test("empty retrieval with expected sources is a measured failure", () => {
    expect(documentMetrics([], ["a"])).toEqual({
      precision: 0,
      recall: 0,
      f1Score: 0,
    });
  });
  test("averages only measured scores", () => {
    expect(mean([null, 0, 1])).toBe(0.5);
    expect(mean([null, NaN])).toBeNull();
  });
  test("rejects invented or missing citation numbers", () => {
    expect(citationNumbersValid("Dalil [1].", 1)).toBe(true);
    expect(citationNumbersValid("Dalil [2].", 1)).toBe(false);
    expect(citationNumbersValid("Tanpa kutipan", 1)).toBe(false);
  });
});
describe("external input", () => {
  test("only makes HTTP(S) sources clickable", () => {
    for (const s of [
      "javascript:alert(1)",
      "data:text/html,x",
      "file:///private",
      "Nama kitab",
    ])
      expect(safeSourceUrl(s)).toBeNull();
    expect(safeSourceUrl("https://example.com/reference")).toBe(
      "https://example.com/reference",
    );
  });
  test("validates JSON documents before ingestion", () => {
    expect(
      parseKnowledgeJson(
        '[{"title":"Zakat","content":"Penjelasan zakat","source":"Kitab"}]',
        "file",
      )[0].title,
    ).toBe("Zakat");
    expect(() =>
      parseKnowledgeJson('[{"content":{"malicious":"object"}}]', "file"),
    ).toThrow();
  });
  test("rejects cross-site authenticated requests", () => {
    expect(() =>
      assertSameOrigin(
        new Request("https://hikmah.test/api", {
          headers: { origin: "https://attacker.test" },
        }),
      ),
    ).toThrow(HttpError);
    expect(() =>
      assertSameOrigin(
        new Request("https://hikmah.test/api", {
          headers: { origin: "https://hikmah.test" },
        }),
      ),
    ).not.toThrow();
  });
  test("rejects oversized bodies without trusting Content-Length", async () => {
    const request = new Request("https://hikmah.test/api", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "x".repeat(100) }),
    });
    await expect(readJsonRequest(request, 20)).rejects.toMatchObject({
      status: 413,
    });
  });
  test("rejects malformed JSON and unsupported media types", async () => {
    await expect(
      readJsonRequest(
        new Request("https://hikmah.test/api", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{",
        }),
      ),
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      readJsonRequest(
        new Request("https://hikmah.test/api", { method: "POST", body: "{}" }),
      ),
    ).rejects.toMatchObject({ status: 415 });
  });
});

describe("stream framing", () => {
  test("preserves UTF-8 and events split across network chunks", async () => {
    const { readSseEvents } = await import("../src/lib/sse");
    const bytes = new TextEncoder().encode(
      'data: {"content":"بسم الله"}\n\ndata: [DONE]\n\n',
    );
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        for (const byte of bytes) controller.enqueue(new Uint8Array([byte]));
        controller.close();
      },
    });
    const events = [];
    for await (const event of readSseEvents(body)) events.push(event);
    expect(events).toEqual(['{"content":"بسم الله"}', "[DONE]"]);
  });
  test("reports a truncated event rather than discarding it", async () => {
    const { readSseEvents } = await import("../src/lib/sse");
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('data: {"content":'));
        controller.close();
      },
    });
    let failed = false;
    try {
      for await (const event of readSseEvents(body)) void event;
    } catch {
      failed = true;
    }
    expect(failed).toBe(true);
  });
});
