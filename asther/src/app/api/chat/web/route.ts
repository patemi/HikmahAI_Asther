import { getSession } from "@/lib/auth";
import { handleChatRequest } from "@/lib/chat-handler";
import { assertSameOrigin, errorResponse, HttpError } from "@/lib/http";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await getSession();
    if (!user) throw new HttpError(401, "Silakan masuk terlebih dahulu.");
    return handleChatRequest(request, { user });
  } catch (error) {
    return errorResponse(error);
  }
}
