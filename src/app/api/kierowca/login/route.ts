import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

import { adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

/* =========================================================
   KONFIGURACJA SESJI
========================================================= */

const COOKIE_NAME =
  "jak-u-mamy-driver-session";

const SESSION_TIME =
  60 * 60 * 24 * 30; // 30 dni

/* =========================================================
   POBRANIE SEKRETU SESJI
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
   POST /api/kierowca/login

   BODY:
   {
     kierowcaId: "...",
     pin: "1234"
   }
========================================================= */

export async function POST(
  request: NextRequest
) {
  try {
    /* =====================================================
       ODCZYT DANYCH
    ===================================================== */

    const body =
      await request.json();

    const kierowcaId =
      typeof body.kierowcaId ===
      "string"
        ? body.kierowcaId.trim()
        : "";

    const pin =
      typeof body.pin ===
      "string"
        ? body.pin.trim()
        : "";

    /* =====================================================
       WALIDACJA ID
    ===================================================== */

    if (!kierowcaId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Wybierz kierowcę.",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       WALIDACJA PIN-U
    ===================================================== */

    if (
      !/^\d{4}$/.test(pin)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "PIN musi składać się dokładnie z 4 cyfr.",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       POBRANIE KIEROWCY
    ===================================================== */

    const kierowcaRef =
      adminDb
        .collection(
          "kierowcy"
        )
        .doc(
          kierowcaId
        );

    const kierowcaSnapshot =
      await kierowcaRef.get();

    /* =====================================================
       KIEROWCA NIE ISTNIEJE
    ===================================================== */

    if (
      !kierowcaSnapshot.exists
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Nie znaleziono kierowcy.",
        },
        {
          status: 404,
        }
      );
    }

    const kierowca =
      kierowcaSnapshot.data();

    /* =====================================================
       KIEROWCA NIEAKTYWNY
    ===================================================== */

    if (
      kierowca?.aktywny !==
      true
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Konto kierowcy jest nieaktywne.",
        },
        {
          status: 403,
        }
      );
    }

    /* =====================================================
       SPRAWDZENIE HASHU PIN-U
    ===================================================== */

    const pinHash =
      typeof kierowca?.pinHash ===
      "string"
        ? kierowca.pinHash
        : "";

    if (!pinHash) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Ten kierowca nie ma ustawionego PIN-u.",
        },
        {
          status: 403,
        }
      );
    }

    /* =====================================================
       PORÓWNANIE PIN-U
    ===================================================== */

    const poprawnyPin =
      await bcrypt.compare(
        pin,
        pinHash
      );

    if (!poprawnyPin) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Nieprawidłowy PIN.",
        },
        {
          status: 401,
        }
      );
    }

    /* =====================================================
       TWORZENIE TOKENU SESJI

       Token zawiera tylko:
       - ID kierowcy
       - typ użytkownika

       Nie zapisujemy PIN-u ani pinHash.
    ===================================================== */

    const secret =
      pobierzSekretSesji();

    const token =
      await new SignJWT({
        kierowcaId:
          kierowcaSnapshot.id,

        role:
          "driver",
      })
        .setProtectedHeader({
          alg: "HS256",
        })
        .setIssuedAt()
        .setExpirationTime(
          "30d"
        )
        .sign(
          secret
        );

    /* =====================================================
       ODPOWIEDŹ
    ===================================================== */

    const response =
      NextResponse.json(
        {
          success: true,

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

    /* =====================================================
       HTTPONLY COOKIE
    ===================================================== */

    response.cookies.set({
      name:
        COOKIE_NAME,

      value:
        token,

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
        SESSION_TIME,
    });

    return response;
  } catch (error) {
    console.error(
      "Błąd logowania kierowcy:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Wystąpił błąd serwera podczas logowania.",
      },
      {
        status: 500,
      }
    );
  }
}