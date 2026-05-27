import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(
  request: NextRequest
) {
  const authenticated =
    request.cookies.get(
      "authenticated"
    );

  if (
    request.nextUrl.pathname.startsWith(
      "/admin"
    ) &&
    !authenticated
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