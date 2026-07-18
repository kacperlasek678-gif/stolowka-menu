import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";
import { timingSafeEqual } from "crypto";

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
   BEZPIECZNE PORÓWNANIE HASEŁ
========================================================= */

function bezpiecznePorownanie(
  podaneHaslo: string,
  poprawneHaslo: string
) {
  const a =
    Buffer.from(
      podaneHaslo,
      "utf8"
    );

  const b =
    Buffer.from(
      poprawneHaslo,
      "utf8"
    );

  if (
    a.length !==
    b.length
  ) {
    return false;
  }

  return timingSafeEqual(
    a,
    b
  );
}

/* =========================================================
   POST /api/admin/login
========================================================= */

export async function POST(
  request: NextRequest
) {
  try {
    /* =====================================================
       POBRANIE HASŁA
    ===================================================== */

    const body =
      await request.json();

    const haslo =
      typeof body.haslo ===
      "string"
        ? body.haslo
        : "";

    if (!haslo) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Wpisz hasło administratora.",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       HASŁO Z .ENV.LOCAL
    ===================================================== */

    const poprawneHaslo =
      process.env.ADMIN_PASSWORD;

    if (!poprawneHaslo) {
      console.error(
        "Brakuje ADMIN_PASSWORD."
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Błąd konfiguracji serwera.",
        },
        {
          status: 500,
        }
      );
    }

    /* =====================================================
       SPRAWDZENIE HASŁA
    ===================================================== */

    const poprawne =
      bezpiecznePorownanie(
        haslo,
        poprawneHaslo
      );

    if (!poprawne) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Nieprawidłowe hasło.",
        },
        {
          status: 401,
        }
      );
    }

    /* =====================================================
       UTWORZENIE TOKENU JWT

       Sesja ważna przez 12 godzin.
    ===================================================== */

    const token =
      await new SignJWT({
        role: "admin",
      })
        .setProtectedHeader({
          alg: "HS256",
        })
        .setIssuedAt()
        .setExpirationTime(
          "12h"
        )
        .sign(
          pobierzSekretSesji()
        );

    /* =====================================================
       ODPOWIEDŹ
    ===================================================== */

    const response =
      NextResponse.json(
        {
          success: true,
        },
        {
          status: 200,
        }
      );

    /* =====================================================
       COOKIE HTTPONLY

       JavaScript w przeglądarce nie ma dostępu do tokenu.
    ===================================================== */

    response.cookies.set({
      name: COOKIE_NAME,

      value: token,

      httpOnly: true,

      secure:
        process.env.NODE_ENV ===
        "production",

      sameSite: "lax",

      path: "/",

      maxAge:
        60 *
        60 *
        12,
    });

    return response;
  } catch (error) {
    console.error(
      "Błąd logowania administratora:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Nie udało się zalogować.",
      },
      {
        status: 500,
      }
    );
  }
}