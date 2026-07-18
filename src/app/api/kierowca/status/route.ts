import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

import { adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

/* =========================================================
   KONFIGURACJA
========================================================= */

const COOKIE_NAME =
  "jak-u-mamy-driver-session";

type Status =
  | "oczekuje"
  | "wTrasie"
  | "dostarczono";

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
   DZISIEJSZA DATA — POLSKA
========================================================= */

function dzisiejszaData() {
  return new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone:
        "Europe/Warsaw",
      year:
        "numeric",
      month:
        "2-digit",
      day:
        "2-digit",
    }
  ).format(
    new Date()
  );
}

/* =========================================================
   POST /api/kierowca/status

   BODY:

   {
     klientId: "...",
     status: "oczekuje" | "wTrasie" | "dostarczono"
   }
========================================================= */

export async function POST(
  request: NextRequest
) {
  try {
    /* =====================================================
       1. SPRAWDZENIE SESJI
    ===================================================== */

    const token =
      request.cookies.get(
        COOKIE_NAME
      )?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Brak aktywnej sesji.",
        },
        {
          status: 401,
        }
      );
    }

    /* =====================================================
       2. WERYFIKACJA JWT
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
      return NextResponse.json(
        {
          success: false,
          error:
            "Sesja wygasła lub jest nieprawidłowa.",
        },
        {
          status: 401,
        }
      );
    }

    /* =====================================================
       3. SPRAWDZENIE ROLI
    ===================================================== */

    if (
      payload.role !==
      "driver"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Brak uprawnień.",
        },
        {
          status: 403,
        }
      );
    }

    /* =====================================================
       4. ID KIEROWCY Z SESJI
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
          error:
            "Nieprawidłowa sesja.",
        },
        {
          status: 401,
        }
      );
    }

    /* =====================================================
       5. ODCZYT BODY
    ===================================================== */

    const body =
      await request.json();

    const klientId =
      typeof body.klientId ===
      "string"
        ? body.klientId.trim()
        : "";

    const status =
      typeof body.status ===
      "string"
        ? body.status
        : "";

    /* =====================================================
       6. WALIDACJA
    ===================================================== */

    if (!klientId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Brakuje ID klienta.",
        },
        {
          status: 400,
        }
      );
    }

    const poprawneStatusy:
      Status[] = [
        "oczekuje",
        "wTrasie",
        "dostarczono",
      ];

    if (
      !poprawneStatusy.includes(
        status as Status
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Nieprawidłowy status dostawy.",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       7. SPRAWDZENIE KIEROWCY
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

    if (
      !kierowcaSnapshot.exists
    ) {
      return NextResponse.json(
        {
          success: false,
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
       8. DZISIEJSZA DATA
    ===================================================== */

    const data =
      dzisiejszaData();

    /* =====================================================
       9. POBRANIE DZISIEJSZEJ TRASY KIEROWCY
    ===================================================== */

    const trasySnapshot =
      await adminDb
        .collection(
          "trasy"
        )
        .where(
          "kierowcaId",
          "==",
          kierowcaId
        )
        .where(
          "data",
          "==",
          data
        )
        .limit(1)
        .get();

    if (
      trasySnapshot.empty
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Nie masz dzisiaj przypisanej trasy.",
        },
        {
          status: 403,
        }
      );
    }

    /* =====================================================
       10. SPRAWDZENIE, CZY KLIENT JEST NA TRASIE

       To bardzo ważne.

       Kierowca nie może ręcznie podać ID innego klienta
       i zmienić jego statusu.
    ===================================================== */

    const trasa =
      trasySnapshot.docs[
        0
      ].data();

    const kolejnosc:
      string[] =
      Array.isArray(
        trasa.kolejnosc
      )
        ? trasa.kolejnosc.filter(
            (
              element
            ): element is string =>
              typeof element ===
              "string"
          )
        : [];

    if (
      !kolejnosc.includes(
        klientId
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Ten klient nie znajduje się na Twojej dzisiejszej trasie.",
        },
        {
          status: 403,
        }
      );
    }

    /* =====================================================
       11. ZAPIS STATUSU

       ID dokumentu zachowujemy zgodne z dotychczasowym
       systemem:

       YYYY-MM-DD_IDKLIENTA
    ===================================================== */

    const dokumentId =
      `${data}_${klientId}`;

    await adminDb
      .collection(
        "dostawy"
      )
      .doc(
        dokumentId
      )
      .set(
        {
          klientId,
          kierowcaId,
          data,
          status:
            status as Status,

          zmieniono:
            new Date(),
        },
        {
          merge:
            true,
        }
      );

    /* =====================================================
       12. ODPOWIEDŹ
    ===================================================== */

    return NextResponse.json(
      {
        success: true,

        klientId,

        status,

        data,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Błąd zmiany statusu dostawy:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Nie udało się zmienić statusu dostawy.",
      },
      {
        status: 500,
      }
    );
  }
}