import { NextResponse } from "next/server";

export const runtime = "nodejs";

const COOKIE_NAME = "jak-u-mamy-driver-session";

/* =========================================================
   POST /api/kierowca/logout
========================================================= */

export async function POST() {
  try {
    const response = NextResponse.json(
      {
        success: true,
        message: "Kierowca został wylogowany.",
      },
      {
        status: 200,
      }
    );

    /* =====================================================
       USUNIĘCIE COOKIE SESJI
    ===================================================== */

    response.cookies.set({
      name: COOKIE_NAME,
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: new Date(0),
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error(
      "Błąd wylogowania kierowcy:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Nie udało się wylogować.",
      },
      {
        status: 500,
      }
    );
  }
}