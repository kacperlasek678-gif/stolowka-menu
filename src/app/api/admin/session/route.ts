import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

export const runtime = "nodejs";

/* =========================================================
   KONFIGURACJA
========================================================= */

const COOKIE_NAME =
  "jak-u-mamy-admin-session";

/* =========================================================
   SEKRET SESJI
========================================================= */

function pobierzSekretSesji() {
  const secret =
    process.env.ADMIN_SESSION_SECRET;

  if (!secret) {
    throw new Error(
      "Brakuje zmiennej ADMIN_SESSION_SECRET."
    );
  }

  return new TextEncoder().encode(
    secret
  );
}

/* =========================================================
   GET /api/admin/session

   Sprawdza:
   1. Czy istnieje cookie sesji
   2. Czy JWT jest prawidłowy
   3. Czy użytkownik ma rolę admin
========================================================= */

export async function GET(
  request: NextRequest
) {
  try {
    /* =====================================================
       POBRANIE COOKIE
    ===================================================== */

    const token =
      request.cookies.get(
        COOKIE_NAME
      )?.value;

    /* =====================================================
       BRAK SESJI
    ===================================================== */

    if (!token) {
      return NextResponse.json(
        {
          success: true,
          authenticated: false,
        },
        {
          status: 200,
        }
      );
    }

    /* =====================================================
       WERYFIKACJA JWT
    ===================================================== */

    try {
      const wynik =
        await jwtVerify(
          token,
          pobierzSekretSesji(),
          {
            algorithms: [
              "HS256",
            ],
          }
        );

      /* ===================================================
         SPRAWDZENIE ROLI
      =================================================== */

      if (
        wynik.payload.role !==
        "admin"
      ) {
        return NextResponse.json(
          {
            success: true,
            authenticated: false,
          },
          {
            status: 200,
          }
        );
      }

      /* ===================================================
         POPRAWNA SESJA
      =================================================== */

      return NextResponse.json(
        {
          success: true,
          authenticated: true,

          user: {
            role: "admin",
          },
        },
        {
          status: 200,

          headers: {
            "Cache-Control":
              "no-store, max-age=0",
          },
        }
      );
    } catch {
      /* ===================================================
         TOKEN WYGASŁ LUB JEST NIEPRAWIDŁOWY

         Usuwamy również stare cookie.
      =================================================== */

      const response =
        NextResponse.json(
          {
            success: true,
            authenticated: false,
          },
          {
            status: 200,
          }
        );

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
    }
  } catch (error) {
    console.error(
      "Błąd sprawdzania sesji administratora:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        authenticated: false,
        error:
          "Nie udało się sprawdzić sesji administratora.",
      },
      {
        status: 500,
      }
    );
  }
}