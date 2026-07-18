import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  requireAdmin,
} from "@/lib/admin-auth";

import {
  adminDb,
} from "@/lib/firebase-admin";

export const runtime =
  "nodejs";

/* =========================================================
   FUNKCJA POMOCNICZA
   SPRAWDZENIE ADMINISTRATORA
========================================================= */

async function sprawdzAdmina(
  request: NextRequest
) {
  const admin =
    await requireAdmin(
      request
    );

  return admin;
}

/* =========================================================
   GET /api/admin/kierowcy

   Pobieranie listy kierowców.
========================================================= */

export async function GET(
  request: NextRequest
) {
  try {
    /* =====================================================
       AUTORYZACJA
    ===================================================== */

    const admin =
      await sprawdzAdmina(
        request
      );

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Brak autoryzacji.",
        },
        {
          status: 401,
        }
      );
    }

    /* =====================================================
       POBRANIE KIEROWCÓW
    ===================================================== */

    const snapshot =
      await adminDb
        .collection(
          "kierowcy"
        )
        .get();

    /* =====================================================
       MAPOWANIE DANYCH

       Nie zwracamy:
       - pin
       - pinHash

       Do przeglądarki trafia tylko informacja,
       czy PIN został ustawiony.
    ===================================================== */

    const kierowcy =
      snapshot.docs.map(
        (document) => {
          const dane =
            document.data();

          const {
            pin,
            pinHash,
            ...bezpieczneDane
          } = dane;

          return {
            id:
              document.id,

            ...bezpieczneDane,

            pinUstawiony:
              Boolean(
                dane.pinUstawiony ||
                  pinHash ||
                  pin
              ),
          };
        }
      );

    /* =====================================================
       SORTOWANIE PO IMIENIU
    ===================================================== */

    kierowcy.sort(
      (a, b) => {
        const imieA =
          typeof a.imie ===
          "string"
            ? a.imie
            : "";

        const imieB =
          typeof b.imie ===
          "string"
            ? b.imie
            : "";

        return imieA.localeCompare(
          imieB,
          "pl"
        );
      }
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
      "Błąd pobierania kierowców:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Nie udało się pobrać kierowców.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   POST /api/admin/kierowcy

   Dodawanie nowego kierowcy.

   PIN będzie ustawiany osobnym bezpiecznym endpointem.
========================================================= */

export async function POST(
  request: NextRequest
) {
  try {
    /* =====================================================
       AUTORYZACJA
    ===================================================== */

    const admin =
      await sprawdzAdmina(
        request
      );

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Brak autoryzacji.",
        },
        {
          status: 401,
        }
      );
    }

    /* =====================================================
       BODY
    ===================================================== */

    const body =
      await request.json();

    const imie =
      typeof body.imie ===
      "string"
        ? body.imie.trim()
        : "";

    const telefon =
      typeof body.telefon ===
      "string"
        ? body.telefon.trim()
        : "";

    const aktywny =
      typeof body.aktywny ===
      "boolean"
        ? body.aktywny
        : true;

    /* =====================================================
       WALIDACJA
    ===================================================== */

    if (!imie) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Podaj imię kierowcy.",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       UTWORZENIE KIEROWCY
    ===================================================== */

    const dokument =
      await adminDb
        .collection(
          "kierowcy"
        )
        .add({
          imie,
          telefon,
          aktywny,

          pinUstawiony:
            false,

          utworzono:
            new Date(),
        });

    /* =====================================================
       ODPOWIEDŹ
    ===================================================== */

    return NextResponse.json(
      {
        success: true,

        kierowca: {
          id:
            dokument.id,

          imie,
          telefon,
          aktywny,

          pinUstawiony:
            false,
        },
      },
      {
        status: 201,
      }
    );

  } catch (error) {
    console.error(
      "Błąd dodawania kierowcy:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Nie udało się dodać kierowcy.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   PATCH /api/admin/kierowcy

   Edycja istniejącego kierowcy.

   Body:
   {
     id: "...",
     imie: "...",
     telefon: "...",
     aktywny: true
   }
========================================================= */

export async function PATCH(
  request: NextRequest
) {
  try {
    /* =====================================================
       AUTORYZACJA
    ===================================================== */

    const admin =
      await sprawdzAdmina(
        request
      );

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Brak autoryzacji.",
        },
        {
          status: 401,
        }
      );
    }

    /* =====================================================
       BODY
    ===================================================== */

    const body =
      await request.json();

    const id =
      typeof body.id ===
      "string"
        ? body.id.trim()
        : "";

    const imie =
      typeof body.imie ===
      "string"
        ? body.imie.trim()
        : "";

    const telefon =
      typeof body.telefon ===
      "string"
        ? body.telefon.trim()
        : "";

    const aktywny =
      typeof body.aktywny ===
      "boolean"
        ? body.aktywny
        : true;

    /* =====================================================
       WALIDACJA ID
    ===================================================== */

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Brakuje identyfikatora kierowcy.",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       WALIDACJA IMIENIA
    ===================================================== */

    if (!imie) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Podaj imię kierowcy.",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       REFERENCJA DO KIEROWCY
    ===================================================== */

    const kierowcaRef =
      adminDb
        .collection(
          "kierowcy"
        )
        .doc(
          id
        );

    /* =====================================================
       SPRAWDZENIE CZY ISTNIEJE
    ===================================================== */

    const snapshot =
      await kierowcaRef.get();

    if (
      !snapshot.exists
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Kierowca nie istnieje.",
        },
        {
          status: 404,
        }
      );
    }

    /* =====================================================
       AKTUALIZACJA

       Nie dotykamy:
       - pin
       - pinHash
       - pinUstawiony
    ===================================================== */

    await kierowcaRef.update({
      imie,
      telefon,
      aktywny,
    });

    /* =====================================================
       ODPOWIEDŹ
    ===================================================== */

    return NextResponse.json(
      {
        success: true,

        kierowca: {
          id,
          imie,
          telefon,
          aktywny,
        },
      },
      {
        status: 200,
      }
    );

  } catch (error) {
    console.error(
      "Błąd aktualizacji kierowcy:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Nie udało się zaktualizować kierowcy.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   DELETE /api/admin/kierowcy

   Usuwanie kierowcy.

   Body:
   {
     id: "..."
   }
========================================================= */

export async function DELETE(
  request: NextRequest
) {
  try {
    /* =====================================================
       AUTORYZACJA
    ===================================================== */

    const admin =
      await sprawdzAdmina(
        request
      );

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Brak autoryzacji.",
        },
        {
          status: 401,
        }
      );
    }

    /* =====================================================
       BODY
    ===================================================== */

    const body =
      await request.json();

    const id =
      typeof body.id ===
      "string"
        ? body.id.trim()
        : "";

    /* =====================================================
       WALIDACJA
    ===================================================== */

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Brakuje identyfikatora kierowcy.",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       REFERENCJA
    ===================================================== */

    const kierowcaRef =
      adminDb
        .collection(
          "kierowcy"
        )
        .doc(
          id
        );

    /* =====================================================
       SPRAWDZENIE CZY KIEROWCA ISTNIEJE
    ===================================================== */

    const snapshot =
      await kierowcaRef.get();

    if (
      !snapshot.exists
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Kierowca nie istnieje.",
        },
        {
          status: 404,
        }
      );
    }

    /* =====================================================
       USUNIĘCIE
    ===================================================== */

    await kierowcaRef.delete();

    /* =====================================================
       ODPOWIEDŹ
    ===================================================== */

    return NextResponse.json(
      {
        success: true,
        message:
          "Kierowca został usunięty.",
      },
      {
        status: 200,
      }
    );

  } catch (error) {
    console.error(
      "Błąd usuwania kierowcy:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Nie udało się usunąć kierowcy.",
      },
      {
        status: 500,
      }
    );
  }
}