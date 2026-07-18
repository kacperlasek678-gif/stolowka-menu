import { NextResponse } from "next/server";

import { adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

/* =========================================================
   GET /api/kierowca/lista

   Publiczny endpoint zwracający listę aktywnych kierowców.

   WAŻNE:
   Nie zwracamy:
   - pinHash
   - PIN-u
   - telefonu
   - żadnych innych prywatnych danych

   Endpoint służy wyłącznie do wyświetlenia listy kierowców
   przed ekranem logowania PIN-em.
========================================================= */

export async function GET() {
  try {
    /* =====================================================
       POBRANIE AKTYWNYCH KIEROWCÓW
    ===================================================== */

    const snapshot =
      await adminDb
        .collection("kierowcy")
        .where("aktywny", "==", true)
        .get();

    /* =====================================================
       TWORZENIE BEZPIECZNEJ LISTY

       Z dokumentu Firestore wybieramy WYŁĄCZNIE:
       - id
       - imie
    ===================================================== */

    const kierowcy =
      snapshot.docs
        .map((dokument) => {
          const dane =
            dokument.data();

          return {
            id: dokument.id,

            imie:
              typeof dane.imie === "string"
                ? dane.imie
                : "",
          };
        })

        /* ===============================================
           Usuwamy rekordy bez imienia
        =============================================== */

        .filter(
          (kierowca) =>
            kierowca.imie.trim() !== ""
        )

        /* ===============================================
           Sortowanie alfabetyczne
        =============================================== */

        .sort((a, b) =>
          a.imie.localeCompare(
            b.imie,
            "pl"
          )
        );

    /* =====================================================
       ODPOWIEDŹ
    ===================================================== */

    return NextResponse.json(
      {
        success: true,
        kierowcy,
      },
      {
        status: 200,

        headers: {
          "Cache-Control":
            "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error(
      "Błąd pobierania listy kierowców:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        kierowcy: [],
        error:
          "Nie udało się pobrać listy kierowców.",
      },
      {
        status: 500,
      }
    );
  }
}