import { deleteSession } from "@/lib/auth";
import { assertSameOrigin, errorResponse } from "@/lib/http";
export async function POST(request: Request) {
  try { assertSameOrigin(request); await deleteSession(); return Response.json({ success: true }); }
  catch (error) { return errorResponse(error); }
}
