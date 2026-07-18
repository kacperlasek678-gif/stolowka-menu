import { NextRequest } from "next/server";
import { jwtVerify } from "jose";

/* =========================================================
   KONFIGURACJA
========================================================= */

const COOKIE_NAME =
  "jak-u-mamy-admin-session";

/* =========================================================
   TYP SESJI ADMINISTRATORA
========================================================= */

export type AdminSession = {
  authenticated: true;
  role: "admin";
};

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
   REQUIRE ADMIN

   Funkcja sprawdza:

   1. Czy istnieje cookie administratora.
   2. Czy token JWT jest prawidłowy.
   3. Czy token nie wygasł.
   4. Czy użytkownik ma rolę "admin".

   Jeśli wszystko jest OK:
   zwraca dane sesji.

   Jeśli nie:
   zwraca null.
========================================================= */

export async function requireAdmin(
  request: NextRequest
): Promise<AdminSession | null> {
  try {
    /* =====================================================
       POBRANIE TOKENU Z COOKIE
    ===================================================== */

    const token =
      request.cookies.get(
        COOKIE_NAME
      )?.value;

    /* =====================================================
       BRAK TOKENU
    ===================================================== */

    if (!token) {
      return null;
    }

    /* =====================================================
       WERYFIKACJA JWT
    ===================================================== */

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

    /* =====================================================
       SPRAWDZENIE ROLI
    ===================================================== */

    if (
      wynik.payload.role !==
      "admin"
    ) {
      return null;
    }

    /* =====================================================
       POPRAWNA SESJA
    ===================================================== */

    return {
      authenticated: true,
      role: "admin",
    };

  } catch (error) {
    /* =====================================================
       Nieprawidłowy lub wygasły token traktujemy
       po prostu jako brak autoryzacji.

       Nie rzucamy błędu dalej, ponieważ API powinno
       wtedy zwrócić 401 Unauthorized.
    ===================================================== */

    console.error(
      "Nieprawidłowa sesja administratora:",
      error
    );

    return null;
  }
}