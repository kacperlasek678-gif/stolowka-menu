"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  collection,
  doc,
  onSnapshot,
  setDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

/* =========================================================
   TYPY
========================================================= */

type Status =
  | "oczekuje"
  | "wTrasie"
  | "dostarczono";

type Abonamentowicz = {
  id: string;
  imieNazwisko: string;
  adres: string;
  telefon?: string;
  godzina: string;
  dni: string[];
  uwagi?: string;
  aktywny: boolean;
  kierowcaId?: string;
};

type Kierowca = {
  id: string;
  imie: string;
  telefon?: string;
  aktywny: boolean;
};

type StatusDostawy = {
  id: string;
  klientId: string;
  data: string;
  status: Status;
};

type Trasa = {
  id: string;
  data: string;
  kierowcaId: string;
  kolejnosc: string[];
};

type Dostawa = Abonamentowicz & {
  status: Status;

  /*
   * Faktyczny kierowca na wybrany dzień.
   */

  dziennyKierowcaId?: string;

  /*
   * Kolejność na trasie.
   */

  kolejnoscTrasy?: number;
};

/* =========================================================
   DNI TYGODNIA
========================================================= */

const mapaDni: Record<number, string> = {
  0: "nd",
  1: "pon",
  2: "wt",
  3: "sr",
  4: "czw",
  5: "pt",
  6: "sob",
};

/* =========================================================
   DZISIEJSZA DATA
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
   DZIEŃ TYGODNIA
========================================================= */

function pobierzDzienTygodnia(
  data: string
) {
  const [
    rok,
    miesiac,
    dzien,
  ] = data
    .split("-")
    .map(Number);

  const obiektDaty =
    new Date(
      rok,
      miesiac - 1,
      dzien
    );

  return mapaDni[
    obiektDaty.getDay()
  ];
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
  ] = data
    .split("-")
    .map(Number);

  return new Intl.DateTimeFormat(
    "pl-PL",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
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
   GŁÓWNA STRONA
========================================================= */

export default function DostawyPage() {
  const [
    klienci,
    setKlienci,
  ] =
    useState<
      Abonamentowicz[]
    >([]);

  const [
    kierowcy,
    setKierowcy,
  ] =
    useState<
      Kierowca[]
    >([]);

  const [
    statusy,
    setStatusy,
  ] =
    useState<
      StatusDostawy[]
    >([]);

  const [
    trasy,
    setTrasy,
  ] =
    useState<
      Trasa[]
    >([]);

  const [
    wybranaData,
    setWybranaData,
  ] =
    useState(
      dzisiejszaData()
    );

  const [
    filtrStatusu,
    setFiltrStatusu,
  ] =
    useState<
      "wszystkie" | Status
    >("wszystkie");

  const [
    filtrKierowcy,
    setFiltrKierowcy,
  ] =
    useState("wszyscy");

  const [
    ladowanie,
    setLadowanie,
  ] =
    useState(true);

  /* =======================================================
     ABONAMENTOWICZE
  ======================================================= */

  useEffect(() => {
    const unsubscribe =
      onSnapshot(
        collection(
          db,
          "abonamentowicze"
        ),

        (snapshot) => {
          const dane =
            snapshot.docs.map(
              (dokument) => ({
                id:
                  dokument.id,

                ...dokument.data(),
              })
            ) as Abonamentowicz[];

          setKlienci(
            dane
          );

          setLadowanie(
            false
          );
        },

        (error) => {
          console.error(
            "Błąd pobierania abonamentowiczów:",
            error
          );

          setLadowanie(
            false
          );
        }
      );

    return () =>
      unsubscribe();
  }, []);

  /* =======================================================
     KIEROWCY
  ======================================================= */

  useEffect(() => {
    const unsubscribe =
      onSnapshot(
        collection(
          db,
          "kierowcy"
        ),

        (snapshot) => {
          const dane =
            snapshot.docs.map(
              (dokument) => ({
                id:
                  dokument.id,

                ...dokument.data(),
              })
            ) as Kierowca[];

          dane.sort(
            (a, b) =>
              (
                a.imie ||
                ""
              ).localeCompare(
                b.imie ||
                  ""
              )
          );

          setKierowcy(
            dane
          );
        },

        (error) => {
          console.error(
            "Błąd pobierania kierowców:",
            error
          );
        }
      );

    return () =>
      unsubscribe();
  }, []);

  /* =======================================================
     STATUSY DOSTAW
  ======================================================= */

  useEffect(() => {
    const unsubscribe =
      onSnapshot(
        collection(
          db,
          "dostawy"
        ),

        (snapshot) => {
          const dane =
            snapshot.docs.map(
              (dokument) => ({
                id:
                  dokument.id,

                ...dokument.data(),
              })
            ) as StatusDostawy[];

          setStatusy(
            dane
          );
        },

        (error) => {
          console.error(
            "Błąd pobierania statusów:",
            error
          );
        }
      );

    return () =>
      unsubscribe();
  }, []);

  /* =======================================================
     TRASY
  ======================================================= */

  useEffect(() => {
    const unsubscribe =
      onSnapshot(
        collection(
          db,
          "trasy"
        ),

        (snapshot) => {
          const dane =
            snapshot.docs.map(
              (dokument) => ({
                id:
                  dokument.id,

                ...dokument.data(),
              })
            ) as Trasa[];

          setTrasy(
            dane
          );
        },

        (error) => {
          console.error(
            "Błąd pobierania tras:",
            error
          );
        }
      );

    return () =>
      unsubscribe();
  }, []);

  /* =======================================================
     DZIEŃ TYGODNIA
  ======================================================= */

  const dzienTygodnia =
    pobierzDzienTygodnia(
      wybranaData
    );

  /* =======================================================
     AKTYWNI KIEROWCY
  ======================================================= */

  const aktywniKierowcy =
    useMemo(() => {
      return kierowcy.filter(
        (kierowca) =>
          kierowca.aktywny
      );
    }, [kierowcy]);

  /* =======================================================
     KLIENCI NA WYBRANY DZIEŃ
  ======================================================= */

  const klienciNaDzis =
    useMemo(() => {
      return klienci
        .filter(
          (klient) =>
            klient.aktywny &&
            klient.dni?.includes(
              dzienTygodnia
            )
        )
        .sort(
          (a, b) =>
            (
              a.godzina ||
              ""
            ).localeCompare(
              b.godzina ||
                ""
            )
        );
    }, [
      klienci,
      dzienTygodnia,
    ]);

  /* =======================================================
     TRASY WYBRANEGO DNIA
  ======================================================= */

  const trasyDnia =
    useMemo(() => {
      return trasy.filter(
        (trasa) =>
          trasa.data ===
          wybranaData
      );
    }, [
      trasy,
      wybranaData,
    ]);

  /* =======================================================
     STATUS KLIENTA
  ======================================================= */

  function pobierzStatus(
    klientId: string
  ): Status {
    const znaleziony =
      statusy.find(
        (status) =>
          status.klientId ===
            klientId &&
          status.data ===
            wybranaData
      );

    return (
      znaleziony?.status ||
      "oczekuje"
    );
  }

  /* =======================================================
     POBIERANIE KIEROWCY
  ======================================================= */

  function pobierzKierowce(
    kierowcaId?: string
  ) {
    if (!kierowcaId) {
      return null;
    }

    return (
      kierowcy.find(
        (kierowca) =>
          kierowca.id ===
          kierowcaId
      ) || null
    );
  }

  /* =======================================================
     SZUKANIE KLIENTA W DZIENNEJ TRASIE
  ======================================================= */

  function znajdzDziennaTraseKlienta(
    klientId: string
  ) {
    return trasyDnia.find(
      (trasa) =>
        trasa.kolejnosc?.includes(
          klientId
        )
    );
  }

  /* =======================================================
     WSZYSTKIE DOSTAWY

     ZASADA:

     1. Jeśli klient jest w dziennej trasie,
        używamy kierowcy z trasy.

     2. Jeśli nie ma go w żadnej dziennej
        trasie, używamy domyślnego kierowcy
        z abonamentowicza.

  ======================================================= */

  const wszystkieDostawy:
    Dostawa[] =
    klienciNaDzis.map(
      (klient) => {
        const dziennaTrasa =
          znajdzDziennaTraseKlienta(
            klient.id
          );

        let
          dziennyKierowcaId:
            | string
            | undefined;

        let
          kolejnoscTrasy:
            | number
            | undefined;

        if (
          dziennaTrasa
        ) {
          dziennyKierowcaId =
            dziennaTrasa.kierowcaId;

          const index =
            dziennaTrasa.kolejnosc.indexOf(
              klient.id
            );

          if (
            index >= 0
          ) {
            kolejnoscTrasy =
              index;
          }
        } else {
          /*
           * Brak ręcznego planu dnia.
           * Używamy kierowcy domyślnego.
           */

          dziennyKierowcaId =
            klient.kierowcaId;
        }

        return {
          ...klient,

          status:
            pobierzStatus(
              klient.id
            ),

          dziennyKierowcaId,

          kolejnoscTrasy,
        };
      }
    );

  /* =======================================================
     FILTROWANIE PO KIEROWCY
  ======================================================= */

  const dostawyKierowcy =
    wszystkieDostawy.filter(
      (dostawa) => {
        if (
          filtrKierowcy ===
          "wszyscy"
        ) {
          return true;
        }

        if (
          filtrKierowcy ===
          "nieprzypisane"
        ) {
          return (
            !dostawa.dziennyKierowcaId
          );
        }

        return (
          dostawa.dziennyKierowcaId ===
          filtrKierowcy
        );
      }
    );

  /* =======================================================
     SORTOWANIE

     Jeśli wybrany jest konkretny kierowca,
     pokazujemy kolejność z Planowania.

     Jeśli nie ma dziennej kolejności,
     używamy godziny dostawy.
  ======================================================= */

  const posortowaneDostawy =
    [...dostawyKierowcy].sort(
      (a, b) => {
        /*
         * Konkretny kierowca.
         */

        if (
          filtrKierowcy !==
            "wszyscy" &&
          filtrKierowcy !==
            "nieprzypisane"
        ) {
          const indexA =
            a.kolejnoscTrasy;

          const indexB =
            b.kolejnoscTrasy;

          if (
            indexA !==
              undefined &&
            indexB !==
              undefined
          ) {
            return (
              indexA -
              indexB
            );
          }

          if (
            indexA !==
            undefined
          ) {
            return -1;
          }

          if (
            indexB !==
            undefined
          ) {
            return 1;
          }
        }

        return (
          a.godzina ||
          ""
        ).localeCompare(
          b.godzina ||
            ""
        );
      }
    );

  /* =======================================================
     STATYSTYKI
  ======================================================= */

  const statystyki = {
    wszystkie:
      posortowaneDostawy.length,

    oczekuje:
      posortowaneDostawy.filter(
        (dostawa) =>
          dostawa.status ===
          "oczekuje"
      ).length,

    wTrasie:
      posortowaneDostawy.filter(
        (dostawa) =>
          dostawa.status ===
          "wTrasie"
      ).length,

    dostarczono:
      posortowaneDostawy.filter(
        (dostawa) =>
          dostawa.status ===
          "dostarczono"
      ).length,
  };

  /* =======================================================
     FILTROWANIE PO STATUSIE
  ======================================================= */

  const widoczneDostawy =
    posortowaneDostawy.filter(
      (dostawa) =>
        filtrStatusu ===
        "wszystkie"
          ? true
          : dostawa.status ===
            filtrStatusu
    );

  /* =======================================================
     ZMIANA STATUSU
  ======================================================= */

  async function zmienStatus(
    klientId: string,
    nowyStatus: Status
  ) {
    try {
      const idDokumentu =
        `${wybranaData}_${klientId}`;

      await setDoc(
        doc(
          db,
          "dostawy",
          idDokumentu
        ),
        {
          klientId,

          data:
            wybranaData,

          status:
            nowyStatus,

          zmieniono:
            new Date(),
        },
        {
          merge: true,
        }
      );
    } catch (error) {
      console.error(
        "Błąd zmiany statusu:",
        error
      );

      alert(
        "Nie udało się zmienić statusu dostawy."
      );
    }
  }

  /* =======================================================
     GOOGLE MAPS
  ======================================================= */

  function otworzMape(
    adres: string
  ) {
    const url =
      "https://www.google.com/maps/search/?api=1&query=" +
      encodeURIComponent(
        adres
      );

    window.open(
      url,
      "_blank"
    );
  }

  /* =======================================================
     LICZBA NIEPRZYPISANYCH
  ======================================================= */

  const liczbaNieprzypisanych =
    wszystkieDostawy.filter(
      (dostawa) =>
        !dostawa.dziennyKierowcaId
    ).length;

  /* =======================================================
     UI
  ======================================================= */

  return (
    <main className="min-h-screen bg-gray-100">

      {/* NAGŁÓWEK */}

      <header className="bg-yellow-400 shadow-sm">

        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-4 px-5 py-5 lg:flex-row lg:items-center">

          <div>

            <h1 className="text-2xl font-bold text-gray-900">
              Jak u Mamy
            </h1>

            <p className="text-gray-700">
              Panel dostaw
            </p>

          </div>

          <div className="flex flex-wrap gap-2">

            <Link
              href="/dostawy/planowanie"
              className="rounded-lg bg-yellow-100 px-4 py-3 font-bold text-gray-900"
            >
              🗺️ Planowanie
            </Link>

            <Link
              href="/dostawy/klienci"
              className="rounded-lg bg-white px-4 py-3 font-bold text-gray-900"
            >
              👥 Abonamentowicze
            </Link>

            <Link
              href="/dostawy/kierowcy"
              className="rounded-lg bg-gray-900 px-4 py-3 font-bold text-white"
            >
              🚗 Kierowcy
            </Link>

          </div>

        </div>

      </header>

      <div className="mx-auto max-w-6xl p-5">

        {/* DATA */}

        <div className="mb-5 rounded-xl bg-white p-5 shadow-sm">

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

            <div>

              <p className="text-sm font-semibold text-gray-500">
                Wybrany dzień
              </p>

              <h2 className="mt-1 text-2xl font-bold capitalize text-gray-900">
                {formatujDate(
                  wybranaData
                )}
              </h2>

            </div>

            <input
              type="date"
              value={
                wybranaData
              }
              onChange={(e) => {
                setWybranaData(
                  e.target.value
                );

                setFiltrStatusu(
                  "wszystkie"
                );

                setFiltrKierowcy(
                  "wszyscy"
                );
              }}
              className="rounded-lg border border-gray-300 bg-white p-3 font-semibold text-gray-900"
            />

          </div>

        </div>

        {/* FILTR KIEROWCÓW */}

        <div className="mb-5 rounded-xl bg-white p-5 shadow-sm">

          <p className="mb-3 font-bold text-gray-900">
            🚗 Wybierz kierowcę
          </p>

          <div className="flex flex-wrap gap-2">

            <button
              onClick={() =>
                setFiltrKierowcy(
                  "wszyscy"
                )
              }
              className={`rounded-lg px-4 py-2 font-semibold ${
                filtrKierowcy ===
                "wszyscy"
                  ? "bg-yellow-400 text-gray-900"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              Wszyscy (
              {
                wszystkieDostawy.length
              })
            </button>

            <button
              onClick={() =>
                setFiltrKierowcy(
                  "nieprzypisane"
                )
              }
              className={`rounded-lg px-4 py-2 font-semibold ${
                filtrKierowcy ===
                "nieprzypisane"
                  ? "bg-orange-500 text-white"
                  : "bg-orange-100 text-orange-700"
              }`}
            >
              ⚠️ Nieprzypisane (
              {
                liczbaNieprzypisanych
              })
            </button>

            {aktywniKierowcy.map(
              (kierowca) => {

                const liczbaDostaw =
                  wszystkieDostawy.filter(
                    (dostawa) =>
                      dostawa.dziennyKierowcaId ===
                      kierowca.id
                  ).length;

                return (
                  <button
                    key={
                      kierowca.id
                    }
                    onClick={() =>
                      setFiltrKierowcy(
                        kierowca.id
                      )
                    }
                    className={`rounded-lg px-4 py-2 font-semibold ${
                      filtrKierowcy ===
                      kierowca.id
                        ? "bg-blue-600 text-white"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    🚗{" "}
                    {
                      kierowca.imie
                    }{" "}
                    (
                    {
                      liczbaDostaw
                    })
                  </button>
                );
              }
            )}

          </div>

        </div>

        {/* STATYSTYKI */}

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">

          <Statystyka
            nazwa="Wszystkie"
            wartosc={
              statystyki.wszystkie
            }
            aktywna={
              filtrStatusu ===
              "wszystkie"
            }
            onClick={() =>
              setFiltrStatusu(
                "wszystkie"
              )
            }
          />

          <Statystyka
            nazwa="Do rozwiezienia"
            wartosc={
              statystyki.oczekuje
            }
            aktywna={
              filtrStatusu ===
              "oczekuje"
            }
            onClick={() =>
              setFiltrStatusu(
                "oczekuje"
              )
            }
          />

          <Statystyka
            nazwa="W trasie"
            wartosc={
              statystyki.wTrasie
            }
            aktywna={
              filtrStatusu ===
              "wTrasie"
            }
            onClick={() =>
              setFiltrStatusu(
                "wTrasie"
              )
            }
          />

          <Statystyka
            nazwa="Dostarczono"
            wartosc={
              statystyki.dostarczono
            }
            aktywna={
              filtrStatusu ===
              "dostarczono"
            }
            onClick={() =>
              setFiltrStatusu(
                "dostarczono"
              )
            }
          />

        </div>

        {/* LISTA DOSTAW */}

        <div className="mt-6 space-y-4">

          {ladowanie && (
            <div className="rounded-xl bg-white p-10 text-center shadow-sm">
              Ładowanie dostaw...
            </div>
          )}

          {!ladowanie &&
            widoczneDostawy.map(
              (
                dostawa,
                index
              ) => {

                const kierowca =
                  pobierzKierowce(
                    dostawa.dziennyKierowcaId
                  );

                return (
                  <div
                    key={
                      dostawa.id
                    }
                    className={`rounded-xl bg-white p-5 shadow-sm ${
                      dostawa.status ===
                      "dostarczono"
                        ? "opacity-60"
                        : ""
                    } ${
                      !dostawa.dziennyKierowcaId
                        ? "border-2 border-orange-300"
                        : ""
                    }`}
                  >

                    <div className="flex flex-col justify-between gap-5 md:flex-row">

                      <div className="flex-1">

                        <div className="mb-3 flex flex-wrap items-center gap-3">

                          {filtrKierowcy !==
                            "wszyscy" &&
                            filtrKierowcy !==
                              "nieprzypisane" && (
                              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-yellow-400 font-bold text-gray-900">
                                {
                                  index +
                                  1
                                }
                              </span>
                            )}

                          <span className="rounded-lg bg-gray-900 px-3 py-1 text-lg font-bold text-white">
                            {dostawa.godzina ||
                              "--:--"}
                          </span>

                          <StatusBadge
                            status={
                              dostawa.status
                            }
                          />

                        </div>

                        <h3 className="text-xl font-bold text-gray-900">
                          {
                            dostawa.imieNazwisko
                          }
                        </h3>

                        <p className="mt-2 text-gray-600">
                          📍{" "}
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
                            className="mt-1 block text-gray-600"
                          >
                            📞{" "}
                            {
                              dostawa.telefon
                            }
                          </a>
                        )}

                        {kierowca ? (
                          <p className="mt-2 font-semibold text-blue-700">
                            🚗 Kierowca:{" "}
                            {
                              kierowca.imie
                            }
                          </p>
                        ) : (
                          <p className="mt-2 font-bold text-orange-600">
                            ⚠️ Brak przypisanego kierowcy
                          </p>
                        )}

                        {dostawa.uwagi && (
                          <p className="mt-3 rounded-lg bg-yellow-50 p-3 text-sm text-gray-700">
                            📝{" "}
                            {
                              dostawa.uwagi
                            }
                          </p>
                        )}

                      </div>

                      {/* PRZYCISKI */}

                      <div className="flex flex-wrap items-end gap-2">

                        <button
                          onClick={() =>
                            otworzMape(
                              dostawa.adres
                            )
                          }
                          className="rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-700"
                        >
                          🗺️ Mapa
                        </button>

                        {dostawa.status ===
                          "oczekuje" && (
                          <button
                            onClick={() =>
                              zmienStatus(
                                dostawa.id,
                                "wTrasie"
                              )
                            }
                            className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white"
                          >
                            🚗 W trasie
                          </button>
                        )}

                        {dostawa.status ===
                          "wTrasie" && (
                          <button
                            onClick={() =>
                              zmienStatus(
                                dostawa.id,
                                "dostarczono"
                              )
                            }
                            className="rounded-lg bg-green-600 px-4 py-2 font-semibold text-white"
                          >
                            ✓ Dostarczono
                          </button>
                        )}

                        {dostawa.status ===
                          "dostarczono" && (
                          <button
                            onClick={() =>
                              zmienStatus(
                                dostawa.id,
                                "oczekuje"
                              )
                            }
                            className="rounded-lg bg-gray-200 px-4 py-2 font-semibold text-gray-700"
                          >
                            ↩ Cofnij
                          </button>
                        )}

                      </div>

                    </div>

                  </div>
                );
              }
            )}

          {!ladowanie &&
            widoczneDostawy.length ===
              0 && (
              <div className="rounded-xl bg-white p-10 text-center shadow-sm">

                <p className="text-lg font-bold text-gray-700">
                  Brak dostaw
                </p>

                <p className="mt-1 text-gray-500">
                  Brak dostaw spełniających wybrane kryteria.
                </p>

              </div>
            )}

        </div>

      </div>

    </main>
  );
}

/* =========================================================
   STATYSTYKA
========================================================= */

function Statystyka({
  nazwa,
  wartosc,
  aktywna,
  onClick,
}: {
  nazwa: string;
  wartosc: number;
  aktywna: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={
        onClick
      }
      className={`rounded-xl p-4 text-left shadow-sm transition ${
        aktywna
          ? "bg-yellow-400"
          : "bg-white hover:bg-gray-50"
      }`}
    >

      <p className="text-sm font-semibold text-gray-600">
        {nazwa}
      </p>

      <p className="mt-1 text-3xl font-bold text-gray-900">
        {wartosc}
      </p>

    </button>
  );
}

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({
  status,
}: {
  status: Status;
}) {
  if (
    status ===
    "oczekuje"
  ) {
    return (
      <span className="rounded-full bg-orange-100 px-3 py-1 text-sm font-bold text-orange-700">
        🟠 Do rozwiezienia
      </span>
    );
  }

  if (
    status ===
    "wTrasie"
  ) {
    return (
      <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-bold text-blue-700">
        🚗 W trasie
      </span>
    );
  }

  return (
    <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-bold text-green-700">
      ✓ Dostarczono
    </span>
  );
}