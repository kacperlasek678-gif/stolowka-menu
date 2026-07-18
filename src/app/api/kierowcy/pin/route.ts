import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest
) {
  try {
    console.log(
      "=== TEST API PIN START ==="
    );

    const body =
      await request.json();

    console.log(
      "Otrzymano body:",
      {
        kierowcaId:
          body.kierowcaId,
        pinOtrzymany:
          Boolean(body.pin),
      }
    );

    /* =========================================
       SPRAWDZENIE ENV
    ========================================= */

    console.log(
      "FIREBASE_ADMIN_PROJECT_ID:",
      process.env
        .FIREBASE_ADMIN_PROJECT_ID
        ? "OK"
        : "BRAK"
    );

    console.log(
      "FIREBASE_ADMIN_CLIENT_EMAIL:",
      process.env
        .FIREBASE_ADMIN_CLIENT_EMAIL
        ? "OK"
        : "BRAK"
    );

    console.log(
      "FIREBASE_ADMIN_PRIVATE_KEY:",
      process.env
        .FIREBASE_ADMIN_PRIVATE_KEY
        ? "OK"
        : "BRAK"
    );

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

    /* =========================================
       WALIDACJA
    ========================================= */

    if (!kierowcaId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Brak ID kierowcy.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !/^\d{4}$/.test(pin)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "PIN musi mieć dokładnie 4 cyfry.",
        },
        {
          status: 400,
        }
      );
    }

    /* =========================================
       DYNAMICZNY IMPORT FIREBASE ADMIN

       Dzięki temu, jeżeli problem jest
       z konfiguracją Firebase Admin,
       zobaczymy dokładny błąd.
    ========================================= */

    console.log(
      "Próba importu Firebase Admin..."
    );

    const {
      adminDb,
    } = await import(
      "@/lib/firebase-admin"
    );

    console.log(
      "Firebase Admin załadowany."
    );

    /* =========================================
       POBRANIE KIEROWCY
    ========================================= */

    console.log(
      "Szukam kierowcy:",
      kierowcaId
    );

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

    console.log(
      "Kierowca znaleziony."
    );

    /* =========================================
       HASHOWANIE
    ========================================= */

    console.log(
      "Hashowanie PIN-u..."
    );

    const pinHash =
      await bcrypt.hash(
        pin,
        12
      );

    console.log(
      "PIN zahashowany."
    );

    /* =========================================
       ZAPIS
    ========================================= */

    await kierowcaRef.update({
      pinHash,
      pinUstawiony:
        true,
      pinZmieniono:
        new Date(),
    });

    console.log(
      "PIN zapisany w Firestore."
    );

    console.log(
      "=== TEST API PIN KONIEC ==="
    );

    return NextResponse.json({
      success: true,
      message:
        "PIN został zapisany.",
    });
  } catch (error) {
    console.error(
      "================================"
    );

    console.error(
      "BŁĄD API PIN:"
    );

    console.error(
      error
    );

    console.error(
      "================================"
    );

    const message =
      error instanceof Error
        ? error.message
        : String(error);

    /*
     * Teraz nawet w przypadku błędu
     * próbujemy zwrócić JSON.
     */

    return NextResponse.json(
      {
        success: false,
        error:
          "Błąd serwera podczas zapisywania PIN-u.",
        details:
          message,
      },
      {
        status: 500,
      }
    );
  }
}