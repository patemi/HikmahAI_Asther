import { authenticateRequest } from "@/lib/auth-route";
export async function POST(request: Request) {
  return authenticateRequest(request, "login");
}
