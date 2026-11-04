export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public retryAfter?: number,
  ) {
    super(message);
  }
}

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (
    request.headers.get("sec-fetch-site") === "cross-site" ||
    (origin && origin !== new URL(request.url).origin)
  ) {
    throw new HttpError(403, "Permintaan dari situs lain tidak diizinkan.");
  }
}

export async function readJsonRequest(
  request: Request,
  maxBytes = 32_768,
): Promise<unknown> {
  if (
    !request.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("application/json")
  ) {
    throw new HttpError(415, "Gunakan Content-Type application/json.");
  }
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, "Isi permintaan wajib diisi.");
  const parts: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > maxBytes) {
        await reader.cancel();
        throw new HttpError(413, "Ukuran permintaan terlalu besar.");
      }
      parts.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const part of parts) {
      bytes.set(part, offset);
      offset += part.length;
    }
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(400, "Format JSON tidak valid.");
  } finally {
    reader.releaseLock();
  }
}

export function errorResponse(error: unknown): Response {
  if (error instanceof HttpError) {
    return Response.json(
      { error: error.message },
      {
        status: error.status,
        headers: error.retryAfter
          ? { "Retry-After": String(error.retryAfter) }
          : undefined,
      },
    );
  }
  console.error(
    "[Request] Unexpected failure",
    error instanceof Error ? error.name : "Unknown",
  );
  return Response.json(
    {
      error: "Layanan belum dapat memproses permintaan. Silakan coba kembali.",
    },
    { status: 500 },
  );
}
