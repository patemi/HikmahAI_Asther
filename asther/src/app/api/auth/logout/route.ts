import { deleteSession } from "@/lib/auth";
import { assertSameOrigin, errorResponse } from "@/lib/http";
export async function POST(request: Request) {
  try { assertSameOrigin(request); await deleteSession(); return Response.redirect(new URL("/login", request.url), 303); }
  catch (error) { return errorResponse(error); }
}
