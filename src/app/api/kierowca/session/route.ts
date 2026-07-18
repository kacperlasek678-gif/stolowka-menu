import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

import { adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

/* =========================================================
   KONFIGURACJA
========================================================= */

const COOKIE_NAME =
  "jak-u-mamy-driver-session";

/* =========================================================
   SEKRET SESJI
========================================================= */

function pobierzSekretSesji() {
  const secret =
    process.env.DRIVER_SESSION_SECRET;

  if (!secret) {
    throw new Error(
      "Brakuje zmiennej DRIVER_SESSION_SECRET."
    );
  }

  return new TextEncoder().encode(
    secret
  );
}

/* =========================================================
   GET /api/kierowca/session

   Sprawdza aktualną sesję kierowcy.
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
          success: false,
          authenticated: false,
          error:
            "Brak aktywnej sesji.",
        },
        {
          status: 401,
        }
      );
    }

    /* =====================================================
       WERYFIKACJA JWT
    ===================================================== */

    let payload;

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

      payload =
        wynik.payload;
    } catch {
      /* ===================================================
         TOKEN NIEPOPRAWNY LUB WYGASŁ
      =================================================== */

      const response =
        NextResponse.json(
          {
            success: false,
            authenticated: false,
            error:
              "Sesja wygasła lub jest nieprawidłowa.",
          },
          {
            status: 401,
          }
        );

      /*
       * Usuwamy nieprawidłowe cookie.
       */

      response.cookies.set({
        name:
          COOKIE_NAME,

        value:
          "",

        httpOnly:
          true,

        secure:
          process.env.NODE_ENV ===
          "production",

        sameSite:
          "lax",

        path:
          "/",

        maxAge:
          0,
      });

      return response;
    }

    /* =====================================================
       SPRAWDZENIE ROLI
    ===================================================== */

    if (
      payload.role !==
      "driver"
    ) {
      return NextResponse.json(
        {
          success: false,
          authenticated: false,
          error:
            "Nieprawidłowy typ sesji.",
        },
        {
          status: 403,
        }
      );
    }

    /* =====================================================
       ID KIEROWCY Z TOKENU
    ===================================================== */

    const kierowcaId =
      typeof payload.kierowcaId ===
      "string"
        ? payload.kierowcaId
        : "";

    if (!kierowcaId) {
      return NextResponse.json(
        {
          success: false,
          authenticated: false,
          error:
            "Nieprawidłowa sesja kierowcy.",
        },
        {
          status: 401,
        }
      );
    }

    /* =====================================================
       POBRANIE AKTUALNYCH DANYCH KIEROWCY

       Nie ufamy wyłącznie danym zapisanym w tokenie.
       Sprawdzamy Firestore.
    ===================================================== */

    const kierowcaSnapshot =
      await adminDb
        .collection(
          "kierowcy"
        )
        .doc(
          kierowcaId
        )
        .get();

    /* =====================================================
       KIEROWCA JUŻ NIE ISTNIEJE
    ===================================================== */

    if (
      !kierowcaSnapshot.exists
    ) {
      return NextResponse.json(
        {
          success: false,
          authenticated: false,
          error:
            "Konto kierowcy nie istnieje.",
        },
        {
          status: 401,
        }
      );
    }

    const kierowca =
      kierowcaSnapshot.data();

    /* =====================================================
       KIEROWCA ZOSTAŁ DEZAKTYWOWANY
    ===================================================== */

    if (
      kierowca?.aktywny !==
      true
    ) {
      return NextResponse.json(
        {
          success: false,
          authenticated: false,
          error:
            "Konto kierowcy jest nieaktywne.",
        },
        {
          status: 403,
        }
      );
    }

    /* =====================================================
       POPRAWNA SESJA
    ===================================================== */

    return NextResponse.json(
      {
        success: true,
        authenticated: true,

        kierowca: {
          id:
            kierowcaSnapshot.id,

          imie:
            kierowca?.imie ||
            "",

          telefon:
            kierowca?.telefon ||
            "",
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Błąd sprawdzania sesji kierowcy:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        authenticated: false,
        error:
          "Wystąpił błąd serwera podczas sprawdzania sesji.",
      },
      {
        status: 500,
      }
    );
  }
}