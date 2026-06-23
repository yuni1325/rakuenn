import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function isAuthorized(request: NextRequest, password: string): boolean {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Basic ")) return false;

  const encoded = auth.slice("Basic ".length);
  try {
    const decoded = atob(encoded);
    const colonIndex = decoded.indexOf(":");
    if (colonIndex === -1) return false;
    return decoded.slice(colonIndex + 1) === password;
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const password = process.env.ACCESS_PASSWORD?.trim();
  if (!password) return NextResponse.next();

  if (isAuthorized(request, password)) return NextResponse.next();

  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Rakuenn", charset="UTF-8"',
    },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/health).*)"],
};
