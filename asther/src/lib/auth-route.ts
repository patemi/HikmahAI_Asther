import {
  loginSchema,
  registerSchema,
  loginUser,
  registerUser,
} from "@/lib/auth";
import {
  assertSameOrigin,
  readJsonRequest,
  errorResponse,
  HttpError,
} from "@/lib/http";
import { consumeLimit, requestIdentity } from "@/lib/limits";

export async function authenticateRequest(
  request: Request,
  mode: "login" | "register",
) {
  try {
    assertSameOrigin(request);
    await consumeLimit(
      "auth-" + mode,
      requestIdentity(request),
      mode === "register" ? 5 : 20,
      900,
    );
    const body = await readJsonRequest(request, 4096);
    const parsed = (
      mode === "register" ? registerSchema : loginSchema
    ).safeParse(body);
    if (!parsed.success)
      throw new HttpError(400, parsed.error.issues[0].message);
    const { email, password } = parsed.data;
    const result =
      mode === "register"
        ? await registerUser(
            email,
            password,
            "name" in parsed.data && typeof parsed.data.name === "string"
              ? parsed.data.name
              : undefined,
          )
        : await loginUser(email, password);
    if (result.error)
      throw new HttpError(mode === "register" ? 400 : 401, result.error);
    return Response.json({ success: true, user: result.user });
  } catch (error) {
    return errorResponse(error);
  }
}
