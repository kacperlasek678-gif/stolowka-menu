"use client";

import {
  FormEvent,
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Loader2,
  LockKeyhole,
  LogIn,
  ShieldCheck,
} from "lucide-react";

/* =========================================================
   TYPY
========================================================= */

type AdminGuardProps = {
  children: ReactNode;
};

/* =========================================================
   ADMIN GUARD

   Działanie:

   1. Sprawdza sesję administratora.
   2. Jeśli sesja istnieje -> pokazuje panel.
   3. Jeśli sesji nie ma -> pokazuje logowanie.
   4. Po poprawnym logowaniu -> pokazuje panel.
========================================================= */

export default function AdminGuard({
  children,
}: AdminGuardProps) {
  /* =======================================================
     STANY
  ======================================================= */

  const [
    sprawdzanieSesji,
    setSprawdzanieSesji,
  ] = useState(true);

  const [
    zalogowany,
    setZalogowany,
  ] = useState(false);

  const [
    haslo,
    setHaslo,
  ] = useState("");

  const [
    logowanie,
    setLogowanie,
  ] = useState(false);

  const [
    blad,
    setBlad,
  ] = useState("");

  /* =======================================================
     SPRAWDZANIE SESJI
  ======================================================= */

  const sprawdzSesje =
    useCallback(async () => {
      try {
        setSprawdzanieSesji(
          true
        );

        const odpowiedz =
          await fetch(
            "/api/admin/session",
            {
              method: "GET",

              credentials:
                "include",

              cache:
                "no-store",
            }
          );

        const dane =
          await odpowiedz.json();

        if (
          odpowiedz.ok &&
          dane.success &&
          dane.authenticated
        ) {
          setZalogowany(
            true
          );
        } else {
          setZalogowany(
            false
          );
        }
      } catch (error) {
        console.error(
          "Błąd sprawdzania sesji administratora:",
          error
        );

        setZalogowany(
          false
        );
      } finally {
        setSprawdzanieSesji(
          false
        );
      }
    }, []);

  /* =======================================================
     SPRAWDZENIE SESJI PO WEJŚCIU
  ======================================================= */

  useEffect(() => {
    sprawdzSesje();
  }, [sprawdzSesje]);

  /* =======================================================
     LOGOWANIE
  ======================================================= */

  async function zaloguj(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      !haslo.trim()
    ) {
      setBlad(
        "Wpisz hasło administratora."
      );

      return;
    }

    try {
      setLogowanie(
        true
      );

      setBlad(
        ""
      );

      const odpowiedz =
        await fetch(
          "/api/admin/login",
          {
            method:
              "POST",

            credentials:
              "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                haslo,
              }),
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
            "Nie udało się zalogować."
        );
      }

      /* ===============================================
         LOGOWANIE UDANE
      =============================================== */

      setHaslo(
        ""
      );

      setBlad(
        ""
      );

      setZalogowany(
        true
      );
    } catch (error) {
      console.error(
        "Błąd logowania administratora:",
        error
      );

      setHaslo(
        ""
      );

      setBlad(
        error instanceof Error
          ? error.message
          : "Nie udało się zalogować."
      );
    } finally {
      setLogowanie(
        false
      );
    }
  }

  /* =======================================================
     ŁADOWANIE SESJI
  ======================================================= */

  if (
    sprawdzanieSesji
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100 p-5">

        <div className="text-center">

          <Loader2
            size={42}
            className="mx-auto animate-spin text-yellow-500"
          />

          <p className="mt-4 font-bold text-gray-700">
            Sprawdzanie sesji...
          </p>

        </div>

      </main>
    );
  }

  /* =======================================================
     ADMIN ZALOGOWANY
  ======================================================= */

  if (
    zalogowany
  ) {
    return (
      <>
        {children}
      </>
    );
  }

  /* =======================================================
     EKRAN LOGOWANIA
  ======================================================= */

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 p-4 sm:p-6">

      <div className="w-full max-w-md">

        {/* =================================================
           LOGO / NAGŁÓWEK
        ================================================= */}

        <div className="mb-6 text-center">

          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gray-950 text-yellow-400 shadow-lg">

            <ShieldCheck
              size={38}
            />

          </div>

          <p className="mt-5 text-sm font-black uppercase tracking-widest text-yellow-600">
            Jak u Mamy
          </p>

          <h1 className="mt-1 text-3xl font-black text-gray-950">
            Panel administratora
          </h1>

          <p className="mt-2 text-gray-500">
            Zaloguj się, aby zarządzać dostawami.
          </p>

        </div>

        {/* =================================================
           FORMULARZ
        ================================================= */}

        <section className="rounded-3xl bg-white p-6 shadow-lg sm:p-8">

          <form
            onSubmit={
              zaloguj
            }
          >

            {/* =============================================
               HASŁO
            ============================================= */}

            <label className="block">

              <span className="text-sm font-bold text-gray-700">
                Hasło administratora
              </span>

              <div className="relative mt-2">

                <LockKeyhole
                  size={20}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="password"

                  value={
                    haslo
                  }

                  onChange={(
                    event
                  ) => {
                    setHaslo(
                      event.target.value
                    );

                    setBlad(
                      ""
                    );
                  }}

                  disabled={
                    logowanie
                  }

                  autoComplete="current-password"

                  autoFocus

                  placeholder="Wpisz hasło"

                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-4 pl-12 pr-4 text-base font-semibold text-gray-950 outline-none transition focus:border-yellow-400 focus:bg-white focus:ring-4 focus:ring-yellow-100 disabled:opacity-60"
                />

              </div>

            </label>

            {/* =============================================
               BŁĄD
            ============================================= */}

            {blad && (

              <div className="mt-4 rounded-2xl bg-red-50 p-4 text-center text-sm font-bold text-red-600">

                {
                  blad
                }

              </div>

            )}

            {/* =============================================
               PRZYCISK LOGOWANIA
            ============================================= */}

            <button
              type="submit"

              disabled={
                logowanie ||
                !haslo
              }

              className="mt-6 flex w-full items-center justify-center gap-3 rounded-2xl bg-yellow-400 px-5 py-4 text-lg font-black text-gray-950 transition hover:bg-yellow-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >

              {logowanie ? (

                <>

                  <Loader2
                    size={22}
                    className="animate-spin"
                  />

                  Logowanie...

                </>

              ) : (

                <>

                  <LogIn
                    size={22}
                  />

                  Zaloguj się

                </>

              )}

            </button>

          </form>

        </section>

        {/* =================================================
           INFORMACJA
        ================================================= */}

        <div className="mt-5 flex items-center justify-center gap-2 text-center text-sm text-gray-400">

          <LockKeyhole
            size={14}
          />

          Dostęp tylko dla administratora

        </div>

      </div>

    </main>
  );
}