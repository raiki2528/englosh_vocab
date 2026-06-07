import { LINE_USER_ID_COOKIE } from "@/lib/line-user-id";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const uid = request.nextUrl.searchParams.get("uid")?.trim();
  const response = NextResponse.next();

  if (uid) {
    response.cookies.set(LINE_USER_ID_COOKIE, uid, {
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }

  return response;
}

export const config = {
  matcher: ["/"],
};
