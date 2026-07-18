"use client";

import {
  Loader2,
  LogOut,
} from "lucide-react";

import {
  useState,
} from "react";

/* =========================================================
   PRZYCISK WYLOGOWANIA ADMINISTRATORA
========================================================= */

export default function AdminLogoutButton() {
  const [
    wylogowywanie,
    setWylogowywanie,
  ] = useState(false);

  /* =======================================================
     WYLOGOWANIE
  ======================================================= */

  async function wyloguj() {
    try {
      setWylogowywanie(
        true
      );

      const odpowiedz =
        await fetch(
          "/api/admin/logout",
          {
            method:
              "POST",

            credentials:
              "include",
          }
        );

      const dane =
        await odpowiedz.json();

      if (
        !odpowiedz.ok ||
        !dane.success
      ) {
        throw new Error(
          dane.error ||
            "Nie udało się wylogować."
        );
      }

      /* ===================================================
         ODŚWIEŻAMY STRONĘ

         AdminGuard ponownie sprawdzi sesję.
         Cookie zostało usunięte, więc pojawi się
         ekran logowania.
      =================================================== */

      window.location.href =
        "/dostawy";

    } catch (
      error
    ) {
      console.error(
        "Błąd wylogowania administratora:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Nie udało się wylogować."
      );

      setWylogowywanie(
        false
      );
    }
  }

  /* =======================================================
     WIDOK
  ======================================================= */

  return (
    <button
      type="button"

      onClick={
        wyloguj
      }

      disabled={
        wylogowywanie
      }

      className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-3 font-bold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
    >

      {wylogowywanie ? (

        <Loader2
          size={18}
          className="animate-spin"
        />

      ) : (

        <LogOut
          size={18}
        />

      )}

      {wylogowywanie
        ? "Wylogowywanie..."
        : "Wyloguj"}

    </button>
  );
}