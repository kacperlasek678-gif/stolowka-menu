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
   TYPY
========================================================= */

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
   DZISIEJSZA DATA

   Używamy polskiej strefy czasowej.
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
   GET /api/kierowca/trasa

   Endpoint:
   1. Pobiera sesję HttpOnly
   2. Weryfikuje JWT
   3. Pobiera ID kierowcy z sesji
   4. Sprawdza kierowcę
   5. Znajduje jego dzisiejszą trasę
   6. Pobiera tylko klientów z jego trasy
   7. Pobiera statusy dostaw
   8. Zwraca gotową trasę
========================================================= */

export async function GET(
  request: NextRequest
) {
  try {
    /* =====================================================
       SESJA
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
       SPRAWDZENIE ROLI
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
       ID KIEROWCY Z SESJI
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
       SPRAWDZENIE KIEROWCY
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
       DZISIEJSZA DATA
    ===================================================== */

    const data =
      dzisiejszaData();

    /* =====================================================
       SZUKANIE TRASY

       Szukamy trasy:
       - dla zalogowanego kierowcy
       - na dzisiejszy dzień
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

    /* =====================================================
       BRAK TRASY

       To nie jest błąd.
       Kierowca może po prostu nie mieć jeszcze trasy.
    ===================================================== */

    if (
      trasySnapshot.empty
    ) {
      return NextResponse.json(
        {
          success: true,

          data,

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

          trasa:
            null,

          dostawy:
            [],
        },
        {
          status: 200,
        }
      );
    }

    /* =====================================================
       TRASA
    ===================================================== */

    const trasaDokument =
      trasySnapshot.docs[0];

    const trasa =
      trasaDokument.data();

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

    /* =====================================================
       POBIERANIE KLIENTÓW

       Pobieramy TYLKO klientów znajdujących się
       na trasie zalogowanego kierowcy.

       Nie wysyłamy całej kolekcji abonamentowiczów.
    ===================================================== */

    const dostawy =
      await Promise.all(
        kolejnosc.map(
          async (
            klientId,
            index
          ) => {
            /* =============================================
               KLIENT
            ============================================= */

            const klientSnapshot =
              await adminDb
                .collection(
                  "abonamentowicze"
                )
                .doc(
                  klientId
                )
                .get();

            if (
              !klientSnapshot.exists
            ) {
              return null;
            }

            const klient =
              klientSnapshot.data();

            /* =============================================
               STATUS DOSTAWY

               ID zgodne z dotychczasowym systemem:
               YYYY-MM-DD_IDKLIENTA
            ============================================= */

            const statusId =
              `${data}_${klientId}`;

            const statusSnapshot =
              await adminDb
                .collection(
                  "dostawy"
                )
                .doc(
                  statusId
                )
                .get();

            let status:
              Status =
              "oczekuje";

            if (
              statusSnapshot.exists
            ) {
              const daneStatusu =
                statusSnapshot.data();

              if (
                daneStatusu
                  ?.status ===
                  "oczekuje" ||
                daneStatusu
                  ?.status ===
                  "wTrasie" ||
                daneStatusu
                  ?.status ===
                  "dostarczono"
              ) {
                status =
                  daneStatusu.status;
              }
            }

            /* =============================================
               GOTOWA DOSTAWA

               Zwracamy tylko dane potrzebne kierowcy.
            ============================================= */

            return {
              id:
                klientSnapshot.id,

              kolejnosc:
                index + 1,

              imieNazwisko:
                klient?.imieNazwisko ||
                "",

              adres:
                klient?.adres ||
                "",

              telefon:
                klient?.telefon ||
                "",

              godzina:
                klient?.godzina ||
                "",

              uwagi:
                klient?.uwagi ||
                "",

              status,
            };
          }
        )
      );

    /* =====================================================
       USUNIĘCIE BRAKUJĄCYCH KLIENTÓW
    ===================================================== */

    const poprawneDostawy =
      dostawy.filter(
        (
          dostawa
        ) =>
          dostawa !==
          null
      );

    /* =====================================================
       ODPOWIEDŹ
    ===================================================== */

    return NextResponse.json(
      {
        success: true,

        data,

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

        trasa: {
          id:
            trasaDokument.id,

          data,

          kierowcaId,
        },

        dostawy:
          poprawneDostawy,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Błąd pobierania trasy kierowcy:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Nie udało się pobrać trasy kierowcy.",
      },
      {
        status: 500,
      }
    );
  }
}