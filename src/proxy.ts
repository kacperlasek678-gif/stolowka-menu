import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(
  request: NextRequest
) {

  const authenticated =
    request.cookies.get(
      "authenticated"
    );

  if (
    !authenticated &&
    request.nextUrl.pathname.startsWith(
      "/admin"
    )
  ) {

    return NextResponse.redirect(
      new URL(
        "/login",
        request.url
      )
    );

  }

  return NextResponse.next();

}

export const config = {
  matcher: ["/admin/:path*"],
};