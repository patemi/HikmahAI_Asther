import { importJsonDocuments } from "@/app/actions/knowledge";
import { assertSameOrigin, errorResponse, HttpError } from "@/lib/http";
import { requireAdmin } from "@/lib/auth";
export async function POST(request: Request) {
  try {
    assertSameOrigin(request); await requireAdmin();
    if (Number(request.headers.get("content-length") || 0) > 2_100_000) throw new HttpError(413, "Ukuran unggahan terlalu besar.");
    const result = await importJsonDocuments(await request.formData());
    return Response.json(result, { status: result.error ? 400 : 200 });
  } catch (error) { return errorResponse(error); }
}
