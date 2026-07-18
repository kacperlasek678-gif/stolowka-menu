"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Car,
  CheckCircle2,
  ChevronRight,
  Clock,
  Loader2,
  LockKeyhole,
  LogOut,
  MapPin,
  Navigation,
  Phone,
  RefreshCw,
  Route,
  ShieldCheck,
  StickyNote,
  Truck,
  UserRound,
} from "lucide-react";

/* =========================================================
   TYPY
========================================================= */

type Status =
  | "oczekuje"
  | "wTrasie"
  | "dostarczono";

type KierowcaLista = {
  id: string;
  imie: string;
};

type Kierowca = {
  id: string;
  imie: string;
  telefon?: string;
};

type Trasa = {
  id: string;
  data: string;
  kierowcaId: string;
};

type Dostawa = {
  id: string;
  kolejnosc: number;
  imieNazwisko: string;
  adres: string;
  telefon?: string;
  godzina?: string;
  uwagi?: string;
  status: Status;
};

/* =========================================================
   DATA
========================================================= */

function dzisiejszaData() {
  const teraz = new Date();

  const rok =
    teraz.getFullYear();

  const miesiac =
    String(
      teraz.getMonth() + 1
    ).padStart(2, "0");

  const dzien =
    String(
      teraz.getDate()
    ).padStart(2, "0");

  return `${rok}-${miesiac}-${dzien}`;
}

/* =========================================================
   FORMATOWANIE DATY
========================================================= */

function formatujDate(
  data: string
) {
  const [
    rok,
    miesiac,
    dzien,
  ] =
    data
      .split("-")
      .map(Number);

  return new Intl.DateTimeFormat(
    "pl-PL",
    {
      weekday:
        "long",
      day:
        "numeric",
      month:
        "long",
      year:
        "numeric",
    }
  ).format(
    new Date(
      rok,
      miesiac - 1,
      dzien
    )
  );
}

/* =========================================================
   GŁÓWNY KOMPONENT
========================================================= */

export default function KierowcaPage() {
  /* =======================================================
     LISTA KIEROWCÓW
  ======================================================= */

  const [
    kierowcy,
    setKierowcy,
  ] =
    useState<
      KierowcaLista[]
    >([]);

  const [
    ladowanieKierowcow,
    setLadowanieKierowcow,
  ] =
    useState(true);

  const [
    bladKierowcow,
    setBladKierowcow,
  ] =
    useState("");

  /* =======================================================
     LOGOWANIE
  ======================================================= */

  const [
    wybranyKierowcaId,
    setWybranyKierowcaId,
  ] =
    useState("");

  const [
    pin,
    setPin,
  ] =
    useState("");

  const [
    logowanie,
    setLogowanie,
  ] =
    useState(false);

  const [
    bladLogowania,
    setBladLogowania,
  ] =
    useState("");

  /* =======================================================
     SESJA
  ======================================================= */

  const [
    zalogowanyKierowca,
    setZalogowanyKierowca,
  ] =
    useState<
      Kierowca | null
    >(null);

  const [
    sprawdzanieSesji,
    setSprawdzanieSesji,
  ] =
    useState(true);

  const [
    wylogowywanie,
    setWylogowywanie,
  ] =
    useState(false);

  /* =======================================================
     TRASA
  ======================================================= */

  const [
    trasa,
    setTrasa,
  ] =
    useState<
      Trasa | null
    >(null);

  const [
    dostawy,
    setDostawy,
  ] =
    useState<
      Dostawa[]
    >([]);

  const [
    ladowanieTrasy,
    setLadowanieTrasy,
  ] =
    useState(false);

  const [
    bladTrasy,
    setBladTrasy,
  ] =
    useState("");

  const [
    zapisywanie,
    setZapisywanie,
  ] =
    useState<
      string | null
    >(null);

  const data =
    trasa?.data ||
    dzisiejszaData();

  /* =======================================================
     POBIERANIE LISTY KIEROWCÓW
  ======================================================= */

  const pobierzKierowcow =
    useCallback(
      async () => {
        try {
          setLadowanieKierowcow(
            true
          );

          setBladKierowcow(
            ""
          );

          const odpowiedz =
            await fetch(
              "/api/kierowca/lista",
              {
                method:
                  "GET",

                cache:
                  "no-store",
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
                "Nie udało się pobrać listy kierowców."
            );
          }

          setKierowcy(
            Array.isArray(
              dane.kierowcy
            )
              ? dane.kierowcy
              : []
          );
        } catch (
          error
        ) {
          console.error(
            "Błąd pobierania kierowców:",
            error
          );

          setKierowcy(
            []
          );

          setBladKierowcow(
            error instanceof
              Error
              ? error.message
              : "Nie udało się pobrać listy kierowców."
          );
        } finally {
          setLadowanieKierowcow(
            false
          );
        }
      },
      []
    );

  /* =======================================================
     POBIERANIE TRASY
  ======================================================= */

  const pobierzTrase =
    useCallback(
      async () => {
        try {
          setLadowanieTrasy(
            true
          );

          setBladTrasy(
            ""
          );

          const odpowiedz =
            await fetch(
              "/api/kierowca/trasa",
              {
                method:
                  "GET",

                credentials:
                  "include",

                cache:
                  "no-store",
              }
            );

          const dane =
            await odpowiedz.json();

          /* ===============================================
             SESJA WYGASŁA
          =============================================== */

          if (
            odpowiedz.status ===
            401
          ) {
            setZalogowanyKierowca(
              null
            );

            setTrasa(
              null
            );

            setDostawy(
              []
            );

            return;
          }

          if (
            !odpowiedz.ok ||
            !dane.success
          ) {
            throw new Error(
              dane.error ||
                "Nie udało się pobrać trasy."
            );
          }

          /* ===============================================
             AKTUALIZACJA KIEROWCY
          =============================================== */

          if (
            dane.kierowca
          ) {
            setZalogowanyKierowca(
              {
                id:
                  dane.kierowca.id,

                imie:
                  dane.kierowca.imie,

                telefon:
                  dane.kierowca.telefon,
              }
            );
          }

          /* ===============================================
             TRASA
          =============================================== */

          setTrasa(
            dane.trasa ||
              null
          );

          /* ===============================================
             DOSTAWY
          =============================================== */

          setDostawy(
            Array.isArray(
              dane.dostawy
            )
              ? dane.dostawy
              : []
          );
        } catch (
          error
        ) {
          console.error(
            "Błąd pobierania trasy:",
            error
          );

          setBladTrasy(
            error instanceof
              Error
              ? error.message
              : "Nie udało się pobrać trasy."
          );
        } finally {
          setLadowanieTrasy(
            false
          );
        }
      },
      []
    );

  /* =======================================================
     SPRAWDZENIE SESJI
  ======================================================= */

  useEffect(() => {
    async function sprawdzSesje() {
      try {
        setSprawdzanieSesji(
          true
        );

        const odpowiedz =
          await fetch(
            "/api/kierowca/session",
            {
              method:
                "GET",

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
          dane.authenticated &&
          dane.kierowca
        ) {
          setZalogowanyKierowca(
            {
              id:
                dane.kierowca.id,

              imie:
                dane.kierowca.imie,

              telefon:
                dane.kierowca.telefon,
            }
          );
        } else {
          setZalogowanyKierowca(
            null
          );
        }
      } catch (
        error
      ) {
        console.error(
          "Błąd sprawdzania sesji:",
          error
        );

        setZalogowanyKierowca(
          null
        );
      } finally {
        setSprawdzanieSesji(
          false
        );
      }
    }

    sprawdzSesje();
  }, []);

  /* =======================================================
     POBRANIE LISTY KIEROWCÓW
  ======================================================= */

  useEffect(() => {
    pobierzKierowcow();
  }, [
    pobierzKierowcow,
  ]);

  /* =======================================================
     POBRANIE TRASY PO ZALOGOWANIU
  ======================================================= */

  useEffect(() => {
    if (
      !zalogowanyKierowca
    ) {
      setTrasa(
        null
      );

      setDostawy(
        []
      );

      return;
    }

    pobierzTrase();
  }, [
    zalogowanyKierowca?.id,
    pobierzTrase,
  ]);

  /* =======================================================
     WYBRANY KIEROWCA
  ======================================================= */

  const wybranyKierowca =
    useMemo(
      () =>
        kierowcy.find(
          (
            kierowca
          ) =>
            kierowca.id ===
            wybranyKierowcaId
        ),
      [
        kierowcy,
        wybranyKierowcaId,
      ]
    );

  /* =======================================================
     WYBÓR KIEROWCY
  ======================================================= */

  function wybierzKierowce(
    kierowcaId: string
  ) {
    setWybranyKierowcaId(
      kierowcaId
    );

    setPin(
      ""
    );

    setBladLogowania(
      ""
    );
  }

  /* =======================================================
     PIN
  ======================================================= */

  function dodajCyfre(
    cyfra: string
  ) {
    if (
      pin.length >=
      4
    ) {
      return;
    }

    setPin(
      (
        poprzedni
      ) =>
        poprzedni +
        cyfra
    );

    setBladLogowania(
      ""
    );
  }

  function usunCyfre() {
    setPin(
      (
        poprzedni
      ) =>
        poprzedni.slice(
          0,
          -1
        )
    );

    setBladLogowania(
      ""
    );
  }

  /* =======================================================
     LOGOWANIE
  ======================================================= */

  async function zaloguj() {
    if (
      !wybranyKierowcaId
    ) {
      setBladLogowania(
        "Wybierz kierowcę."
      );

      return;
    }

    if (
      pin.length !==
      4
    ) {
      setBladLogowania(
        "Wpisz 4-cyfrowy PIN."
      );

      return;
    }

    try {
      setLogowanie(
        true
      );

      setBladLogowania(
        ""
      );

      const odpowiedz =
        await fetch(
          "/api/kierowca/login",
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
              JSON.stringify(
                {
                  kierowcaId:
                    wybranyKierowcaId,

                  pin,
                }
              ),
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

      if (
        !dane.kierowca
      ) {
        throw new Error(
          "Serwer nie zwrócił danych kierowcy."
        );
      }

      setZalogowanyKierowca(
        {
          id:
            dane.kierowca.id,

          imie:
            dane.kierowca.imie,

          telefon:
            dane.kierowca.telefon,
        }
      );

      setPin(
        ""
      );

      setWybranyKierowcaId(
        ""
      );
    } catch (
      error
    ) {
      setPin(
        ""
      );

      setBladLogowania(
        error instanceof
          Error
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
     WYLOGOWANIE
  ======================================================= */

  async function wyloguj() {
    try {
      setWylogowywanie(
        true
      );

      const odpowiedz =
        await fetch(
          "/api/kierowca/logout",
          {
            method:
              "POST",

            credentials:
              "include",
          }
        );

      if (
        !odpowiedz.ok
      ) {
        throw new Error(
          "Nie udało się wylogować."
        );
      }

      setZalogowanyKierowca(
        null
      );

      setTrasa(
        null
      );

      setDostawy(
        []
      );

      setWybranyKierowcaId(
        ""
      );

      setPin(
        ""
      );

      setBladLogowania(
        ""
      );

      setBladTrasy(
        ""
      );
    } catch (
      error
    ) {
      console.error(
        "Błąd wylogowania:",
        error
      );

      alert(
        "Nie udało się wylogować. Spróbuj ponownie."
      );
    } finally {
      setWylogowywanie(
        false
      );
    }
  }

  /* =======================================================
     ZMIANA STATUSU PRZEZ API
  ======================================================= */

  async function zmienStatus(
    klientId: string,
    nowyStatus: Status
  ) {
    try {
      setZapisywanie(
        klientId
      );

      const odpowiedz =
        await fetch(
          "/api/kierowca/status",
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
              JSON.stringify(
                {
                  klientId,

                  status:
                    nowyStatus,
                }
              ),
          }
        );

      const dane =
        await odpowiedz.json();

      /* ===============================================
         SESJA WYGASŁA
      =============================================== */

      if (
        odpowiedz.status ===
        401
      ) {
        setZalogowanyKierowca(
          null
        );

        setTrasa(
          null
        );

        setDostawy(
          []
        );

        return;
      }

      if (
        !odpowiedz.ok ||
        !dane.success
      ) {
        throw new Error(
          dane.error ||
            "Nie udało się zmienić statusu."
        );
      }

      /* ===============================================
         AKTUALIZACJA LOKALNA
      =============================================== */

      setDostawy(
        (
          poprzednie
        ) =>
          poprzednie.map(
            (
              dostawa
            ) =>
              dostawa.id ===
              klientId
                ? {
                    ...dostawa,

                    status:
                      nowyStatus,
                  }
                : dostawa
          )
      );
    } catch (
      error
    ) {
      console.error(
        "Błąd zmiany statusu:",
        error
      );

      alert(
        error instanceof
          Error
          ? error.message
          : "Nie udało się zmienić statusu."
      );
    } finally {
      setZapisywanie(
        null
      );
    }
  }

  /* =======================================================
     NAWIGACJA
  ======================================================= */

  function otworzNawigacje(
    adres: string
  ) {
    const url =
      "https://www.google.com/maps/dir/?api=1&destination=" +
      encodeURIComponent(
        adres
      );

    window.open(
      url,
      "_blank"
    );
  }

  /* =======================================================
     STATYSTYKI
  ======================================================= */

  const dostarczone =
    dostawy.filter(
      (
        dostawa
      ) =>
        dostawa.status ===
        "dostarczono"
    ).length;

  const pozostalo =
    dostawy.length -
    dostarczone;

  const procent =
    dostawy.length >
    0
      ? Math.round(
          (
            dostarczone /
            dostawy.length
          ) *
            100
        )
      : 0;

  const nastepnaDostawa =
    dostawy.find(
      (
        dostawa
      ) =>
        dostawa.status !==
        "dostarczono"
    );

  /* =======================================================
     SPRAWDZANIE SESJI
  ======================================================= */

  if (
    sprawdzanieSesji
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100">

        <div className="text-center">

          <Loader2
            size={
              42
            }
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
     EKRAN LOGOWANIA
  ======================================================= */

  if (
    !zalogowanyKierowca
  ) {
    return (
      <main className="min-h-screen bg-gray-100 pb-24">

        <header className="bg-gray-950 text-white">

          <div className="mx-auto max-w-lg px-5 py-8">

            <div className="flex items-center gap-4">

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-400 text-gray-950">

                <Truck
                  size={
                    28
                  }
                />

              </div>

              <div>

                <p className="text-sm font-bold text-yellow-400">
                  Jak u Mamy
                </p>

                <h1 className="text-2xl font-black">
                  Panel kierowcy
                </h1>

              </div>

            </div>

          </div>

        </header>

        <div className="mx-auto max-w-lg p-4 sm:p-5">

          {!wybranyKierowcaId ? (

            /* =================================================
               WYBÓR KIEROWCY
            ================================================= */

            <section className="rounded-2xl bg-white p-6 shadow-sm">

              <div className="text-center">

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-100 text-yellow-700">

                  <UserRound
                    size={
                      30
                    }
                  />

                </div>

                <h2 className="mt-4 text-2xl font-black text-gray-900">
                  Kim jesteś?
                </h2>

                <p className="mt-2 text-gray-500">
                  Wybierz swoje imię, aby zalogować się do panelu.
                </p>

              </div>

              {ladowanieKierowcow ? (

                <div className="py-10 text-center">

                  <Loader2
                    size={
                      32
                    }
                    className="mx-auto animate-spin text-yellow-500"
                  />

                  <p className="mt-3 text-gray-500">
                    Pobieranie kierowców...
                  </p>

                </div>

              ) : bladKierowcow ? (

                <div className="mt-6">

                  <div className="rounded-xl bg-red-50 p-4 text-center font-semibold text-red-600">
                    {
                      bladKierowcow
                    }
                  </div>

                  <button
                    type="button"
                    onClick={
                      pobierzKierowcow
                    }
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gray-950 px-4 py-3 font-bold text-white"
                  >

                    <RefreshCw
                      size={
                        18
                      }
                    />

                    Spróbuj ponownie

                  </button>

                </div>

              ) : kierowcy.length ===
                0 ? (

                <div className="mt-6 rounded-xl bg-gray-50 p-5 text-center text-gray-500">
                  Brak aktywnych kierowców.
                </div>

              ) : (

                <div className="mt-6 space-y-3">

                  {kierowcy.map(
                    (
                      kierowca
                    ) => (

                      <button
                        key={
                          kierowca.id
                        }
                        type="button"
                        onClick={() =>
                          wybierzKierowce(
                            kierowca.id
                          )
                        }
                        className="flex w-full items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 text-left transition hover:border-yellow-400 hover:bg-yellow-50"
                      >

                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-700">

                          <Car
                            size={
                              22
                            }
                          />

                        </div>

                        <div className="flex-1">

                          <p className="text-lg font-black text-gray-900">
                            {
                              kierowca.imie
                            }
                          </p>

                        </div>

                        <ChevronRight
                          size={
                            22
                          }
                          className="text-gray-400"
                        />

                      </button>

                    )
                  )}

                </div>

              )}

            </section>

          ) : (

            /* =================================================
               EKRAN PIN
            ================================================= */

            <section className="rounded-2xl bg-white p-6 shadow-sm">

              <div className="text-center">

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-100 text-yellow-700">

                  <LockKeyhole
                    size={
                      30
                    }
                  />

                </div>

                <p className="mt-4 text-sm font-semibold text-gray-500">
                  Logowanie jako
                </p>

                <h2 className="text-2xl font-black text-gray-900">
                  {
                    wybranyKierowca
                      ?.imie
                  }
                </h2>

                <p className="mt-2 text-gray-500">
                  Wpisz swój 4-cyfrowy PIN.
                </p>

              </div>

              {/* PIN DOTS */}

              <div className="mt-7 flex justify-center gap-4">

                {[
                  0,
                  1,
                  2,
                  3,
                ].map(
                  (
                    index
                  ) => (

                    <div
                      key={
                        index
                      }
                      className={`h-4 w-4 rounded-full ${
                        pin.length >
                        index
                          ? "bg-gray-950"
                          : "bg-gray-200"
                      }`}
                    />

                  )
                )}

              </div>

              {/* BŁĄD */}

              {bladLogowania && (

                <div className="mt-5 rounded-xl bg-red-50 p-3 text-center font-semibold text-red-600">
                  {
                    bladLogowania
                  }
                </div>

              )}

              {/* KLAWIATURA */}

              <div className="mx-auto mt-7 grid max-w-xs grid-cols-3 gap-3">

                {[
                  "1",
                  "2",
                  "3",
                  "4",
                  "5",
                  "6",
                  "7",
                  "8",
                  "9",
                ].map(
                  (
                    cyfra
                  ) => (

                    <button
                      key={
                        cyfra
                      }
                      type="button"
                      disabled={
                        logowanie
                      }
                      onClick={() =>
                        dodajCyfre(
                          cyfra
                        )
                      }
                      className="flex h-16 items-center justify-center rounded-2xl bg-gray-100 text-2xl font-black text-gray-900 transition active:scale-95 active:bg-yellow-200 disabled:opacity-50"
                    >
                      {
                        cyfra
                      }
                    </button>

                  )
                )}

                <button
                  type="button"
                  disabled={
                    logowanie
                  }
                  onClick={
                    usunCyfre
                  }
                  className="flex h-16 items-center justify-center rounded-2xl bg-gray-100 text-xl font-bold text-gray-700"
                >
                  ←
                </button>

                <button
                  type="button"
                  disabled={
                    logowanie
                  }
                  onClick={() =>
                    dodajCyfre(
                      "0"
                    )
                  }
                  className="flex h-16 items-center justify-center rounded-2xl bg-gray-100 text-2xl font-black text-gray-900 transition active:scale-95 active:bg-yellow-200"
                >
                  0
                </button>

                <button
                  type="button"
                  disabled={
                    logowanie ||
                    pin.length !==
                      4
                  }
                  onClick={
                    zaloguj
                  }
                  className="flex h-16 items-center justify-center rounded-2xl bg-yellow-400 text-gray-950 disabled:opacity-30"
                >

                  {logowanie ? (

                    <Loader2
                      size={
                        25
                      }
                      className="animate-spin"
                    />

                  ) : (

                    <ShieldCheck
                      size={
                        26
                      }
                    />

                  )}

                </button>

              </div>

              <button
                type="button"
                disabled={
                  logowanie
                }
                onClick={() => {
                  setWybranyKierowcaId(
                    ""
                  );

                  setPin(
                    ""
                  );

                  setBladLogowania(
                    ""
                  );
                }}
                className="mt-6 w-full rounded-xl bg-gray-100 px-4 py-3 font-bold text-gray-600"
              >
                Wybierz innego kierowcę
              </button>

            </section>

          )}

        </div>

      </main>
    );
  }

  /* =======================================================
     PANEL KIEROWCY
  ======================================================= */

  return (
    <main className="min-h-screen bg-gray-100 pb-24">

      {/* HEADER */}

      <header className="bg-gray-950 text-white">

        <div className="mx-auto max-w-3xl px-5 py-7">

          <div className="flex items-center gap-4">

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-400 text-gray-950">

              <Truck
                size={
                  28
                }
              />

            </div>

            <div className="min-w-0 flex-1">

              <p className="text-sm font-bold text-yellow-400">
                Jak u Mamy
              </p>

              <h1 className="text-2xl font-black">
                Panel kierowcy
              </h1>

            </div>

          </div>

          <div className="mt-5 flex items-end justify-between gap-4">

            <div>

              <p className="capitalize text-gray-400">
                {
                  formatujDate(
                    data
                  )
                }
              </p>

              <p className="mt-1 font-bold text-white">
                {
                  zalogowanyKierowca.imie
                }
              </p>

            </div>

            <button
              type="button"
              onClick={
                wyloguj
              }
              disabled={
                wylogowywanie
              }
              className="flex items-center gap-2 rounded-xl bg-gray-800 px-3 py-2 text-sm font-bold text-gray-300 disabled:opacity-50"
            >

              {wylogowywanie ? (

                <Loader2
                  size={
                    17
                  }
                  className="animate-spin"
                />

              ) : (

                <LogOut
                  size={
                    17
                  }
                />

              )}

              {wylogowywanie
                ? "Wylogowywanie..."
                : "Wyloguj"}

            </button>

          </div>

        </div>

      </header>

      <div className="mx-auto max-w-3xl p-4 sm:p-5">

        {/* ŁADOWANIE TRASY */}

        {ladowanieTrasy && (

          <section className="rounded-2xl bg-white p-8 text-center shadow-sm">

            <Loader2
              size={
                40
              }
              className="mx-auto animate-spin text-yellow-500"
            />

            <p className="mt-4 font-bold text-gray-700">
              Pobieranie Twojej trasy...
            </p>

          </section>

        )}

        {/* BŁĄD TRASY */}

        {!ladowanieTrasy &&
          bladTrasy && (

          <section className="rounded-2xl bg-red-50 p-6 text-center">

            <p className="font-bold text-red-700">
              {
                bladTrasy
              }
            </p>

            <button
              type="button"
              onClick={
                pobierzTrase
              }
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 font-bold text-white"
            >

              <RefreshCw
                size={
                  18
                }
              />

              Spróbuj ponownie

            </button>

          </section>

        )}

        {/* BRAK TRASY */}

        {!ladowanieTrasy &&
          !bladTrasy &&
          !trasa && (

          <section className="rounded-2xl border border-orange-200 bg-orange-50 p-8 text-center">

            <Route
              size={
                42
              }
              className="mx-auto text-orange-400"
            />

            <h2 className="mt-4 text-xl font-bold text-orange-800">
              Brak zaplanowanej trasy
            </h2>

            <p className="mt-2 text-orange-700">
              Twoja trasa na dzisiaj nie została jeszcze przygotowana.
            </p>

            <button
              type="button"
              onClick={
                pobierzTrase
              }
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-200 px-4 py-3 font-bold text-orange-900"
            >

              <RefreshCw
                size={
                  18
                }
              />

              Odśwież trasę

            </button>

          </section>

        )}

        {/* TRASA */}

        {!ladowanieTrasy &&
          !bladTrasy &&
          trasa && (

          <>

            {/* POSTĘP */}

            <section className="rounded-2xl bg-white p-5 shadow-sm">

              <div className="flex items-end justify-between">

                <div>

                  <p className="text-sm font-semibold text-gray-500">
                    Postęp trasy
                  </p>

                  <p className="mt-1 text-3xl font-black text-gray-900">
                    {
                      dostarczone
                    }{" "}
                    /{" "}
                    {
                      dostawy.length
                    }
                  </p>

                </div>

                <div className="text-right">

                  <p className="text-2xl font-black text-green-600">
                    {
                      procent
                    }
                    %
                  </p>

                  <p className="text-sm text-gray-500">
                    Pozostało:{" "}
                    {
                      pozostalo
                    }
                  </p>

                </div>

              </div>

              <div className="mt-4 h-3 overflow-hidden rounded-full bg-gray-100">

                <div
                  className="h-full rounded-full bg-green-500 transition-all duration-500"
                  style={{
                    width:
                      `${procent}%`,
                  }}
                />

              </div>

              <button
                type="button"
                onClick={
                  pobierzTrase
                }
                disabled={
                  ladowanieTrasy
                }
                className="mt-4 flex items-center gap-2 text-sm font-bold text-gray-500"
              >

                <RefreshCw
                  size={
                    16
                  }
                />

                Odśwież dane

              </button>

            </section>

            {/* NASTĘPNY PRZYSTANEK */}

            {nastepnaDostawa ? (

              <section className="mt-5 overflow-hidden rounded-2xl bg-gray-950 text-white shadow-lg">

                <div className="bg-yellow-400 px-5 py-3 text-sm font-black uppercase tracking-wide text-gray-950">
                  Następny przystanek
                </div>

                <div className="p-5">

                  <p className="text-sm font-semibold text-gray-400">
                    Dostawa dla
                  </p>

                  <h2 className="mt-1 text-2xl font-black">
                    {
                      nastepnaDostawa.imieNazwisko
                    }
                  </h2>

                  <div className="mt-5 space-y-3">

                    {nastepnaDostawa.godzina && (

                      <div className="flex items-center gap-3 text-gray-300">

                        <Clock
                          size={
                            20
                          }
                          className="text-yellow-400"
                        />

                        {
                          nastepnaDostawa.godzina
                        }

                      </div>

                    )}

                    <div className="flex items-start gap-3 text-gray-300">

                      <MapPin
                        size={
                          20
                        }
                        className="mt-0.5 shrink-0 text-yellow-400"
                      />

                      {
                        nastepnaDostawa.adres
                      }

                    </div>

                  </div>

                  {nastepnaDostawa.telefon && (

                    <a
                      href={`tel:${nastepnaDostawa.telefon.replace(
                        /\s/g,
                        ""
                      )}`}
                      className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-700 bg-gray-900 px-5 py-3 font-bold text-white"
                    >

                      <Phone
                        size={
                          20
                        }
                      />

                      Zadzwoń

                    </a>

                  )}

                  <button
                    type="button"
                    onClick={() =>
                      otworzNawigacje(
                        nastepnaDostawa.adres
                      )
                    }
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-yellow-400 px-5 py-4 text-lg font-black text-gray-950"
                  >

                    <Navigation
                      size={
                        22
                      }
                    />

                    Nawiguj

                  </button>

                  {nastepnaDostawa.status ===
                    "oczekuje" && (

                    <button
                      type="button"
                      disabled={
                        zapisywanie ===
                        nastepnaDostawa.id
                      }
                      onClick={() =>
                        zmienStatus(
                          nastepnaDostawa.id,
                          "wTrasie"
                        )
                      }
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-4 font-bold text-white disabled:opacity-50"
                    >

                      {zapisywanie ===
                      nastepnaDostawa.id ? (

                        <Loader2
                          size={
                            20
                          }
                          className="animate-spin"
                        />

                      ) : (

                        <Car
                          size={
                            20
                          }
                        />

                      )}

                      Rozpoczynam dostawę

                    </button>

                  )}

                  {nastepnaDostawa.status ===
                    "wTrasie" && (

                    <button
                      type="button"
                      disabled={
                        zapisywanie ===
                        nastepnaDostawa.id
                      }
                      onClick={() =>
                        zmienStatus(
                          nastepnaDostawa.id,
                          "dostarczono"
                        )
                      }
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-4 font-bold text-white disabled:opacity-50"
                    >

                      {zapisywanie ===
                      nastepnaDostawa.id ? (

                        <Loader2
                          size={
                            20
                          }
                          className="animate-spin"
                        />

                      ) : (

                        <CheckCircle2
                          size={
                            20
                          }
                        />

                      )}

                      Dostarczono

                    </button>

                  )}

                </div>

              </section>

            ) : (

              <section className="mt-5 rounded-2xl bg-green-100 p-8 text-center">

                <CheckCircle2
                  size={
                    50
                  }
                  className="mx-auto text-green-600"
                />

                <h2 className="mt-4 text-2xl font-black text-green-800">
                  Trasa zakończona!
                </h2>

                <p className="mt-2 text-green-700">
                  Wszystkie dostawy zostały dostarczone.
                </p>

              </section>

            )}

            {/* WSZYSTKIE PRZYSTANKI */}

            <section className="mt-7">

              <div className="mb-4 flex items-center justify-between">

                <div>

                  <p className="text-sm font-semibold text-gray-500">
                    Dzisiejsza trasa
                  </p>

                  <h2 className="text-xl font-black text-gray-900">
                    Wszystkie przystanki
                  </h2>

                </div>

                <Route
                  size={
                    26
                  }
                  className="text-gray-400"
                />

              </div>

              {dostawy.length ===
              0 ? (

                <div className="rounded-2xl bg-white p-6 text-center text-gray-500 shadow-sm">
                  Na tej trasie nie ma jeszcze żadnych dostaw.
                </div>

              ) : (

                <div className="space-y-4">

                  {dostawy.map(
                    (
                      dostawa,
                      index
                    ) => (

                      <article
                        key={
                          dostawa.id
                        }
                        className={`rounded-2xl border bg-white p-5 shadow-sm ${
                          dostawa.status ===
                          "dostarczono"
                            ? "border-green-200 opacity-70"
                            : dostawa.status ===
                                "wTrasie"
                              ? "border-blue-300"
                              : "border-gray-200"
                        }`}
                      >

                        <div className="flex items-start gap-4">

                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-black ${
                              dostawa.status ===
                              "dostarczono"
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-400 text-gray-950"
                            }`}
                          >

                            {dostawa.status ===
                            "dostarczono" ? (

                              <CheckCircle2
                                size={
                                  20
                                }
                              />

                            ) : (

                              dostawa.kolejnosc ||
                              index +
                                1

                            )}

                          </div>

                          <div className="min-w-0 flex-1">

                            <h3 className="text-lg font-black text-gray-900">
                              {
                                dostawa.imieNazwisko
                              }
                            </h3>

                            {dostawa.godzina && (

                              <p className="mt-2 flex items-center gap-2 text-sm text-gray-500">

                                <Clock
                                  size={
                                    16
                                  }
                                />

                                {
                                  dostawa.godzina
                                }

                              </p>

                            )}

                            <p className="mt-2 flex items-start gap-2 text-sm text-gray-600">

                              <MapPin
                                size={
                                  16
                                }
                                className="mt-0.5 shrink-0"
                              />

                              {
                                dostawa.adres
                              }

                            </p>

                            {dostawa.telefon && (

                              <a
                                href={`tel:${dostawa.telefon.replace(
                                  /\s/g,
                                  ""
                                )}`}
                                className="mt-2 flex items-center gap-2 text-sm font-semibold text-blue-600"
                              >

                                <Phone
                                  size={
                                    16
                                  }
                                />

                                {
                                  dostawa.telefon
                                }

                              </a>

                            )}

                            {dostawa.uwagi && (

                              <div className="mt-3 flex items-start gap-2 rounded-xl bg-yellow-50 p-3 text-sm text-gray-700">

                                <StickyNote
                                  size={
                                    16
                                  }
                                  className="mt-0.5 shrink-0 text-yellow-600"
                                />

                                {
                                  dostawa.uwagi
                                }

                              </div>

                            )}

                          </div>

                        </div>

                        <div className="mt-4 grid gap-2 sm:grid-cols-2">

                          <button
                            type="button"
                            onClick={() =>
                              otworzNawigacje(
                                dostawa.adres
                              )
                            }
                            className="flex items-center justify-center gap-2 rounded-xl border border-gray-300 px-4 py-3 font-bold text-gray-700"
                          >

                            <Navigation
                              size={
                                18
                              }
                            />

                            Nawiguj

                          </button>

                          {dostawa.status ===
                            "oczekuje" && (

                            <button
                              type="button"
                              disabled={
                                zapisywanie ===
                                dostawa.id
                              }
                              onClick={() =>
                                zmienStatus(
                                  dostawa.id,
                                  "wTrasie"
                                )
                              }
                              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-bold text-white disabled:opacity-50"
                            >

                              {zapisywanie ===
                              dostawa.id ? (

                                <Loader2
                                  size={
                                    18
                                  }
                                  className="animate-spin"
                                />

                              ) : (

                                <Car
                                  size={
                                    18
                                  }
                                />

                              )}

                              W trasie

                            </button>

                          )}

                          {dostawa.status ===
                            "wTrasie" && (

                            <button
                              type="button"
                              disabled={
                                zapisywanie ===
                                dostawa.id
                              }
                              onClick={() =>
                                zmienStatus(
                                  dostawa.id,
                                  "dostarczono"
                                )
                              }
                              className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 font-bold text-white disabled:opacity-50"
                            >

                              {zapisywanie ===
                              dostawa.id ? (

                                <Loader2
                                  size={
                                    18
                                  }
                                  className="animate-spin"
                                />

                              ) : (

                                <CheckCircle2
                                  size={
                                    18
                                  }
                                />

                              )}

                              Dostarczono

                            </button>

                          )}

                          {dostawa.status ===
                            "dostarczono" && (

                            <button
                              type="button"
                              disabled={
                                zapisywanie ===
                                dostawa.id
                              }
                              onClick={() =>
                                zmienStatus(
                                  dostawa.id,
                                  "oczekuje"
                                )
                              }
                              className="rounded-xl bg-gray-100 px-4 py-3 font-bold text-gray-600 disabled:opacity-50"
                            >

                              {zapisywanie ===
                              dostawa.id
                                ? "Zapisywanie..."
                                : "↩ Cofnij status"}

                            </button>

                          )}

                        </div>

                      </article>

                    )
                  )}

                </div>

              )}

            </section>

          </>

        )}

      </div>

    </main>
  );
}