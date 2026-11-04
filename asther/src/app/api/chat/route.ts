import { verifyApiToken } from "@/lib/auth";
import { handleChatRequest } from "@/lib/chat-handler";
import { errorResponse, HttpError } from "@/lib/http";
import { consumeLimit, requestIdentity } from "@/lib/limits";

export async function POST(request: Request) {
  try {
    await consumeLimit("api-auth", requestIdentity(request), 120, 60);
    const token = request.headers
      .get("authorization")
      ?.match(/^Bearer (.+)$/)?.[1];
    if (!token || !(await verifyApiToken(token)))
      throw new HttpError(401, "Unauthorized");
    return handleChatRequest(request, { apiToken: token });
  } catch (error) {
    return errorResponse(error);
  }
}
export async function OPTIONS() {
  return new Response(null, { status: 204 });
}
