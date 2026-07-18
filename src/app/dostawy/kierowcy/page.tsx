"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Car,
  KeyRound,
  Pencil,
  Phone,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

import {
  createDriver,
  deleteDriver,
  getDrivers,
  updateDriver,
} from "@/lib/api/kierowcy";
import type { Kierowca } from "@/types/kierowca";

/* =========================================================
   TYPY
========================================================= */

/* =========================================================
   GŁÓWNY KOMPONENT
========================================================= */

export default function KierowcyPage() {
  const [
    kierowcy,
    setKierowcy,
  ] =
    useState<Kierowca[]>(
      []
    );

  const [
    imie,
    setImie,
  ] =
    useState("");

  const [
    telefon,
    setTelefon,
  ] =
    useState("");

  const [
    pin,
    setPin,
  ] =
    useState("");

  const [
    aktywny,
    setAktywny,
  ] =
    useState(true);

  const [
    edytowanyId,
    setEdytowanyId,
  ] =
    useState<
      string | null
    >(null);

  const [
    ladowanie,
    setLadowanie,
  ] =
    useState(true);

  const [
    zapisywanie,
    setZapisywanie,
  ] =
    useState(false);

  const [
    komunikat,
    setKomunikat,
  ] =
    useState("");

  const [
    blad,
    setBlad,
  ] =
    useState("");

  /* =======================================================
     POBIERANIE KIEROWCÓW
  ======================================================= */

  const pobierzKierowcow = useCallback(async () => {
    try {
      setLadowanie(true);
      const dane = await getDrivers();
      setKierowcy(dane.kierowcy);
    } catch (error) {
      console.error("Błąd pobierania kierowców:", error);
      setBlad("Nie udało się pobrać kierowców.");
    } finally {
      setLadowanie(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(pobierzKierowcow);
  }, [pobierzKierowcow]);

  /* =======================================================
     RESET FORMULARZA
  ======================================================= */

  function resetujFormularz() {
    setImie("");
    setTelefon("");
    setPin("");
    setAktywny(true);
    setEdytowanyId(null);
    setBlad("");
  }

  /* =======================================================
     USTAWIANIE PIN-U PRZEZ API
  ======================================================= */

  async function ustawPin(
    kierowcaId: string,
    nowyPin: string
  ) {
    const odpowiedz =
      await fetch(
        "/api/kierowcy/pin",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              kierowcaId,
              pin:
                nowyPin,
            }),
        }
      );

    const dane =
      await odpowiedz.json();

    if (
      !odpowiedz.ok
    ) {
      throw new Error(
        dane.error ||
          "Nie udało się zapisać PIN-u."
      );
    }
  }

  /* =======================================================
     ZAPIS KIEROWCY
  ======================================================= */

  async function zapiszKierowce(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setBlad("");
    setKomunikat("");

    const czysteImie =
      imie.trim();

    const czystyTelefon =
      telefon.trim();

    const czystyPin =
      pin.trim();

    /* =====================================================
       WALIDACJA IMIENIA
    ===================================================== */

    if (!czysteImie) {
      setBlad(
        "Podaj imię kierowcy."
      );

      return;
    }

    /* =====================================================
       WALIDACJA PIN-U
    ===================================================== */

    if (
      !edytowanyId &&
      !czystyPin
    ) {
      setBlad(
        "Nowy kierowca musi mieć ustawiony PIN."
      );

      return;
    }

    if (
      czystyPin &&
      !/^\d{4}$/.test(
        czystyPin
      )
    ) {
      setBlad(
        "PIN musi składać się dokładnie z 4 cyfr."
      );

      return;
    }

    try {
      setZapisywanie(
        true
      );

      /* ===================================================
         EDYCJA ISTNIEJĄCEGO KIEROWCY
      =================================================== */

      if (
        edytowanyId
      ) {
        await updateDriver(edytowanyId, {
          imie: czysteImie,
          telefon: czystyTelefon,
          aktywny,
        });

        /*
         * PIN zmieniamy tylko wtedy,
         * gdy administrator wpisał nowy.
         */

        if (
          czystyPin
        ) {
          await ustawPin(
            edytowanyId,
            czystyPin
          );
        }

        setKomunikat(
          czystyPin
            ? "Dane kierowcy i PIN zostały zaktualizowane."
            : "Dane kierowcy zostały zaktualizowane."
        );
      }

      /* ===================================================
         NOWY KIEROWCA
      =================================================== */

      else {
        const dokument = await createDriver({
          imie: czysteImie,
          telefon: czystyTelefon,
          aktywny,
        });

        /*
         * Po utworzeniu kierowcy
         * ustawiamy PIN przez bezpieczny endpoint.
         */

        try {
          await ustawPin(
            dokument.kierowca.id,
            czystyPin
          );
        } catch (
          pinError
        ) {
          /*
           * Jeżeli zapis PIN-u się nie uda,
           * kierowca pozostanie w bazie,
           * ale będzie oznaczony jako
           * "PIN nieustawiony".
           */

          console.error(
            "Kierowca został utworzony, ale nie udało się ustawić PIN-u:",
            pinError
          );

          setBlad(
            "Kierowca został dodany, ale nie udało się ustawić PIN-u. Edytuj kierowcę i spróbuj ustawić PIN ponownie."
          );

          resetujFormularz();
          await pobierzKierowcow();

          return;
        }

        setKomunikat(
          "Kierowca został dodany i PIN został ustawiony."
        );
      }

      resetujFormularz();
      await pobierzKierowcow();
    } catch (error) {
      console.error(
        "Błąd zapisywania kierowcy:",
        error
      );

      setBlad(
        error instanceof Error
          ? error.message
          : "Nie udało się zapisać kierowcy."
      );
    } finally {
      setZapisywanie(
        false
      );
    }
  }

  /* =======================================================
     ROZPOCZĘCIE EDYCJI
  ======================================================= */

  function edytujKierowce(
    kierowca: Kierowca
  ) {
    setEdytowanyId(
      kierowca.id
    );

    setImie(
      kierowca.imie ||
        ""
    );

    setTelefon(
      kierowca.telefon ||
        ""
    );

    setAktywny(
      kierowca.aktywny
    );

    /*
     * Nigdy nie pobieramy starego PIN-u.
     * Pole zostaje puste.
     */

    setPin("");

    setBlad("");
    setKomunikat("");

    window.scrollTo({
      top: 0,
      behavior:
        "smooth",
    });
  }

  /* =======================================================
     USUWANIE KIEROWCY
  ======================================================= */

  async function usunKierowce(
    kierowca: Kierowca
  ) {
    const potwierdzenie =
      window.confirm(
        `Czy na pewno chcesz usunąć kierowcę "${kierowca.imie}"?`
      );

    if (
      !potwierdzenie
    ) {
      return;
    }

    try {
      await deleteDriver(kierowca.id);

      if (
        edytowanyId ===
        kierowca.id
      ) {
        resetujFormularz();
      }

      setKomunikat(
        "Kierowca został usunięty."
      );

      await pobierzKierowcow();
    } catch (error) {
      console.error(
        "Błąd usuwania kierowcy:",
        error
      );

      setBlad(
        "Nie udało się usunąć kierowcy."
      );
    }
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <main className="min-h-screen bg-gray-100">

      <div className="mx-auto max-w-6xl p-5">

        {/* NAGŁÓWEK */}

        <div className="mb-6">

          <p className="text-sm font-bold uppercase tracking-wide text-yellow-600">
            Jak u Mamy
          </p>

          <h1 className="mt-1 text-3xl font-black text-gray-900">
            Kierowcy
          </h1>

          <p className="mt-2 text-gray-500">
            Zarządzaj kierowcami oraz ich dostępem do Panelu Kierowcy.
          </p>

        </div>

        {/* KOMUNIKAT */}

        {komunikat && (

          <div className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4 font-semibold text-green-700">
            ✓ {komunikat}
          </div>

        )}

        {/* BŁĄD */}

        {blad && (

          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 font-semibold text-red-700">
            {blad}
          </div>

        )}

        {/* FORMULARZ */}

        <section className="mb-7 rounded-2xl bg-white p-5 shadow-sm sm:p-6">

          <div className="mb-5 flex items-center justify-between gap-4">

            <div>

              <p className="text-sm font-semibold text-gray-500">
                {edytowanyId
                  ? "Edycja kierowcy"
                  : "Nowy kierowca"}
              </p>

              <h2 className="text-xl font-black text-gray-900">
                {edytowanyId
                  ? "Edytuj dane kierowcy"
                  : "Dodaj kierowcę"}
              </h2>

            </div>

            {edytowanyId && (

              <button
                type="button"
                onClick={
                  resetujFormularz
                }
                className="flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-2 font-bold text-gray-700"
              >

                <X
                  size={18}
                />

                Anuluj

              </button>

            )}

          </div>

          <form
            onSubmit={
              zapiszKierowce
            }
            className="space-y-5"
          >

            {/* IMIĘ */}

            <div>

              <label className="mb-2 block text-sm font-bold text-gray-700">
                Imię kierowcy
              </label>

              <div className="relative">

                <UserRound
                  size={20}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="text"
                  value={
                    imie
                  }
                  onChange={(e) =>
                    setImie(
                      e.target.value
                    )
                  }
                  placeholder="np. Mateusz"
                  className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-12 pr-4 text-gray-900 outline-none focus:border-yellow-400"
                />

              </div>

            </div>

            {/* TELEFON */}

            <div>

              <label className="mb-2 block text-sm font-bold text-gray-700">
                Telefon
              </label>

              <div className="relative">

                <Phone
                  size={20}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="tel"
                  value={
                    telefon
                  }
                  onChange={(e) =>
                    setTelefon(
                      e.target.value
                    )
                  }
                  placeholder="np. 500 600 700"
                  className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-12 pr-4 text-gray-900 outline-none focus:border-yellow-400"
                />

              </div>

            </div>

            {/* PIN */}

            <div>

              <label className="mb-2 block text-sm font-bold text-gray-700">

                {edytowanyId
                  ? "Nowy PIN"
                  : "PIN kierowcy"}

              </label>

              <div className="relative">

                <KeyRound
                  size={20}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="password"
                  inputMode="numeric"
                  autoComplete="new-password"
                  maxLength={4}
                  value={
                    pin
                  }
                  onChange={(e) => {

                    const wartosc =
                      e.target.value.replace(
                        /\D/g,
                        ""
                      );

                    setPin(
                      wartosc.slice(
                        0,
                        4
                      )
                    );

                  }}
                  placeholder={
                    edytowanyId
                      ? "Zostaw puste, aby nie zmieniać PIN-u"
                      : "4 cyfry"
                  }
                  className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-12 pr-4 text-lg font-bold tracking-[0.3em] text-gray-900 outline-none focus:border-yellow-400"
                />

              </div>

              {edytowanyId ? (

                <p className="mt-2 text-sm text-gray-500">
                  Stary PIN nie jest wyświetlany. Jeśli chcesz go zmienić, wpisz nowy 4-cyfrowy PIN.
                </p>

              ) : (

                <p className="mt-2 text-sm text-gray-500">
                  Kierowca użyje tego PIN-u podczas pierwszego logowania do swojego panelu.
                </p>

              )}

            </div>

            {/* AKTYWNY */}

            <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-gray-50 p-4">

              <input
                type="checkbox"
                checked={
                  aktywny
                }
                onChange={(e) =>
                  setAktywny(
                    e.target.checked
                  )
                }
                className="h-5 w-5"
              />

              <div>

                <p className="font-bold text-gray-900">
                  Aktywny kierowca
                </p>

                <p className="text-sm text-gray-500">
                  Aktywny kierowca będzie widoczny w systemie dostaw.
                </p>

              </div>

            </label>

            {/* ZAPIS */}

            <button
              type="submit"
              disabled={
                zapisywanie
              }
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-yellow-400 px-5 py-4 text-lg font-black text-gray-950 transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >

              {edytowanyId ? (

                <Save
                  size={21}
                />

              ) : (

                <Plus
                  size={21}
                />

              )}

              {zapisywanie
                ? "Zapisywanie..."
                : edytowanyId
                  ? "Zapisz zmiany"
                  : "Dodaj kierowcę"}

            </button>

          </form>

        </section>

        {/* LISTA */}

        <section>

          <div className="mb-4">

            <p className="text-sm font-semibold text-gray-500">
              Zespół
            </p>

            <h2 className="text-xl font-black text-gray-900">
              Lista kierowców ({kierowcy.length})
            </h2>

          </div>

          {ladowanie ? (

            <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
              Ładowanie kierowców...
            </div>

          ) : kierowcy.length ===
            0 ? (

            <div className="rounded-2xl bg-white p-10 text-center shadow-sm">

              <Car
                size={45}
                className="mx-auto text-gray-300"
              />

              <p className="mt-4 text-lg font-bold text-gray-700">
                Brak kierowców
              </p>

              <p className="mt-1 text-gray-500">
                Dodaj pierwszego kierowcę za pomocą formularza.
              </p>

            </div>

          ) : (

            <div className="grid gap-4 md:grid-cols-2">

              {kierowcy.map(
                (
                  kierowca
                ) => (

                  <article
                    key={
                      kierowca.id
                    }
                    className="rounded-2xl bg-white p-5 shadow-sm"
                  >

                    <div className="flex items-start justify-between gap-4">

                      <div className="flex min-w-0 items-center gap-4">

                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-yellow-100 text-yellow-700">

                          <Car
                            size={24}
                          />

                        </div>

                        <div className="min-w-0">

                          <h3 className="truncate text-lg font-black text-gray-900">
                            {
                              kierowca.imie
                            }
                          </h3>

                          {kierowca.telefon && (

                            <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">

                              <Phone
                                size={14}
                              />

                              {
                                kierowca.telefon
                              }

                            </p>

                          )}

                        </div>

                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          kierowca.aktywny
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {kierowca.aktywny
                          ? "Aktywny"
                          : "Nieaktywny"}
                      </span>

                    </div>

                    {/* STATUS PIN */}

                    <div
                      className={`mt-4 flex items-center gap-2 rounded-xl p-3 text-sm font-bold ${
                        kierowca.pinUstawiony
                          ? "bg-green-50 text-green-700"
                          : "bg-orange-50 text-orange-700"
                      }`}
                    >

                      {kierowca.pinUstawiony ? (

                        <ShieldCheck
                          size={18}
                        />

                      ) : (

                        <KeyRound
                          size={18}
                        />

                      )}

                      {kierowca.pinUstawiony
                        ? "PIN ustawiony"
                        : "PIN nie został ustawiony"}

                    </div>

                    {/* AKCJE */}

                    <div className="mt-4 flex gap-2">

                      <button
                        onClick={() =>
                          edytujKierowce(
                            kierowca
                          )
                        }
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-100 px-4 py-3 font-bold text-gray-700 transition hover:bg-gray-200"
                      >

                        <Pencil
                          size={17}
                        />

                        Edytuj

                      </button>

                      <button
                        onClick={() =>
                          usunKierowce(
                            kierowca
                          )
                        }
                        className="flex items-center justify-center rounded-xl bg-red-50 px-4 py-3 font-bold text-red-600 transition hover:bg-red-100"
                        title="Usuń kierowcę"
                      >

                        <Trash2
                          size={18}
                        />

                      </button>

                    </div>

                  </article>

                )
              )}

            </div>

          )}

        </section>

      </div>

    </main>
  );
}
