import { NextResponse } from "next/server";

import { SESSION_COOKIE } from "@/lib/session";

export async function GET(request: Request) {
  const response = NextResponse.redirect(new URL("/login", request.url));
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    expires: new Date(0),
    path: "/",
  });

  return response;
}
