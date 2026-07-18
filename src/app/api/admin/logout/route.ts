import { NextResponse } from "next/server";

export const runtime = "nodejs";

/* =========================================================
   KONFIGURACJA
========================================================= */

const COOKIE_NAME =
  "jak-u-mamy-admin-session";

/* =========================================================
   POST /api/admin/logout

   Usuwa cookie sesji administratora.
========================================================= */

export async function POST() {
  try {
    /* =====================================================
       ODPOWIEDŹ
    ===================================================== */

    const response =
      NextResponse.json(
        {
          success: true,
          message:
            "Administrator został wylogowany.",
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

      secure:
        process.env.NODE_ENV ===
        "production",

      sameSite: "lax",

      path: "/",

      expires:
        new Date(0),

      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error(
      "Błąd wylogowania administratora:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Nie udało się wylogować administratora.",
      },
      {
        status: 500,
      }
    );
  }
}