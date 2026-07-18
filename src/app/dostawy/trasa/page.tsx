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

type Status = "oczekuje" | "wTrasie" | "dostarczono";

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
  kolejnoscTrasy?: number | null;
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

const mapaDni: Record<number, string> = {
  0: "nd",
  1: "pon",
  2: "wt",
  3: "sr",
  4: "czw",
  5: "pt",
  6: "sob",
};

function pobierzDzisiejszaDate() {
  const teraz = new Date();

  const rok = teraz.getFullYear();

  const miesiac = String(
    teraz.getMonth() + 1
  ).padStart(2, "0");

  const dzien = String(
    teraz.getDate()
  ).padStart(2, "0");

  return `${rok}-${miesiac}-${dzien}`;
}

function pobierzDzienTygodnia() {
  return mapaDni[new Date().getDay()];
}

export default function TrasaPage() {
  const [klienci, setKlienci] = useState<
    Abonamentowicz[]
  >([]);

  const [kierowcy, setKierowcy] = useState<
    Kierowca[]
  >([]);

  const [statusy, setStatusy] = useState<
    StatusDostawy[]
  >([]);

  const [wybranyKierowca, setWybranyKierowca] =
    useState("");

  const [ladowanie, setLadowanie] =
    useState(true);

  const dzisiejszaData =
    pobierzDzisiejszaDate();

  const dzienTygodnia =
    pobierzDzienTygodnia();

  // KIEROWCY

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "kierowcy"),

      (snapshot) => {
        const dane = snapshot.docs.map(
          (dokument) => ({
            id: dokument.id,
            ...dokument.data(),
          })
        ) as Kierowca[];

        dane.sort((a, b) =>
          a.imie.localeCompare(b.imie)
        );

        setKierowcy(dane);
      }
    );

    return () => unsubscribe();
  }, []);

  // ABONAMENTOWICZE

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "abonamentowicze"),

      (snapshot) => {
        const dane = snapshot.docs.map(
          (dokument) => ({
            id: dokument.id,
            ...dokument.data(),
          })
        ) as Abonamentowicz[];

        setKlienci(dane);
        setLadowanie(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // STATUSY

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "dostawy"),

      (snapshot) => {
        const dane = snapshot.docs.map(
          (dokument) => ({
            id: dokument.id,
            ...dokument.data(),
          })
        ) as StatusDostawy[];

        setStatusy(dane);
      }
    );

    return () => unsubscribe();
  }, []);

  function pobierzStatus(
    klientId: string
  ): Status {
    const status = statusy.find(
      (element) =>
        element.klientId === klientId &&
        element.data === dzisiejszaData
    );

    return status?.status || "oczekuje";
  }

  // DOSTAWY WYBRANEGO KIEROWCY

  const dostawy = useMemo(() => {
    if (!wybranyKierowca) {
      return [];
    }

    return klienci
      .filter(
        (klient) =>
          klient.aktywny &&
          klient.kierowcaId ===
            wybranyKierowca &&
          klient.dni?.includes(
            dzienTygodnia
          )
      )
      .map((klient) => ({
        ...klient,
        status: pobierzStatus(
          klient.id
        ),
      }))
      .sort((a, b) => {

        // DOSTARCZONE NA KONIEC

        if (
          a.status === "dostarczono" &&
          b.status !== "dostarczono"
        ) {
          return 1;
        }

        if (
          a.status !== "dostarczono" &&
          b.status === "dostarczono"
        ) {
          return -1;
        }

        // KOLEJNOŚĆ TRASY

        const kolejnoscA =
          a.kolejnoscTrasy ?? 999999;

        const kolejnoscB =
          b.kolejnoscTrasy ?? 999999;

        if (kolejnoscA !== kolejnoscB) {
          return kolejnoscA - kolejnoscB;
        }

        // JEŚLI BRAK KOLEJNOŚCI - GODZINA

        return (
          a.godzina || ""
        ).localeCompare(
          b.godzina || ""
        );
      });

  }, [
    klienci,
    statusy,
    wybranyKierowca,
    dzienTygodnia,
    dzisiejszaData,
  ]);

  const pozostalo = dostawy.filter(
    (dostawa) =>
      dostawa.status !== "dostarczono"
  ).length;

  const dostarczono = dostawy.filter(
    (dostawa) =>
      dostawa.status === "dostarczono"
  ).length;

  async function zmienStatus(
    klientId: string,
    status: Status
  ) {
    try {
      const idDokumentu =
        `${dzisiejszaData}_${klientId}`;

      await setDoc(
        doc(
          db,
          "dostawy",
          idDokumentu
        ),
        {
          klientId,
          data: dzisiejszaData,
          status,
          zmieniono: new Date(),
        },
        {
          merge: true,
        }
      );

    } catch (error) {

      console.error(error);

      alert(
        "Nie udało się zmienić statusu."
      );
    }
  }

  function otworzNawigacje(
    adres: string
  ) {
    const url =
      "https://www.google.com/maps/dir/?api=1&destination=" +
      encodeURIComponent(adres);

    window.open(
      url,
      "_blank"
    );
  }

  const aktywniKierowcy =
    kierowcy.filter(
      (kierowca) =>
        kierowca.aktywny
    );

  const kierowca =
    kierowcy.find(
      (k) =>
        k.id ===
        wybranyKierowca
    );

  return (
    <main className="min-h-screen bg-gray-100">

      {/* NAGŁÓWEK */}

      <header className="sticky top-0 z-10 bg-yellow-400 shadow-sm">

        <div className="mx-auto max-w-2xl px-4 py-4">

          <div className="flex items-center justify-between gap-3">

            <div>

              <h1 className="text-xl font-bold text-gray-900">
                Jak u Mamy
              </h1>

              <p className="text-sm text-gray-700">
                🚗 Trasa kierowcy
              </p>

            </div>

            <Link
              href="/dostawy"
              className="rounded-lg bg-gray-900 px-3 py-2 text-sm font-bold text-white"
            >
              Panel
            </Link>

          </div>

        </div>

      </header>

      <div className="mx-auto max-w-2xl p-4">

        {/* WYBÓR KIEROWCY */}

        <div className="rounded-xl bg-white p-5 shadow-sm">

          <label className="mb-2 block font-bold text-gray-900">
            Wybierz kierowcę
          </label>

          <select
            value={wybranyKierowca}
            onChange={(e) =>
              setWybranyKierowca(
                e.target.value
              )
            }
            className="w-full rounded-xl border border-gray-300 bg-white p-4 text-lg font-bold text-gray-900"
          >

            <option value="">
              -- Wybierz --
            </option>

            {aktywniKierowcy.map(
              (kierowca) => (
                <option
                  key={
                    kierowca.id
                  }
                  value={
                    kierowca.id
                  }
                >
                  {kierowca.imie}
                </option>
              )
            )}

          </select>

        </div>

        {/* BRAK KIEROWCY */}

        {!wybranyKierowca && (

          <div className="mt-4 rounded-xl bg-white p-10 text-center shadow-sm">

            <p className="text-4xl">
              🚗
            </p>

            <h2 className="mt-3 text-xl font-bold text-gray-900">
              Wybierz kierowcę
            </h2>

            <p className="mt-2 text-gray-500">
              Zobaczysz swoją dzisiejszą listę dostaw.
            </p>

          </div>

        )}

        {/* PANEL KIEROWCY */}

        {wybranyKierowca && (
          <>

            <div className="mt-4 rounded-xl bg-gray-900 p-5 text-white">

              <p className="text-sm text-gray-300">
                Dzisiejsza trasa
              </p>

              <h2 className="mt-1 text-2xl font-bold">
                🚗 {kierowca?.imie}
              </h2>

              <div className="mt-5 grid grid-cols-3 gap-2">

                <div className="rounded-lg bg-white/10 p-3 text-center">

                  <p className="text-2xl font-bold">
                    {dostawy.length}
                  </p>

                  <p className="text-xs text-gray-300">
                    Wszystkie
                  </p>

                </div>

                <div className="rounded-lg bg-white/10 p-3 text-center">

                  <p className="text-2xl font-bold">
                    {pozostalo}
                  </p>

                  <p className="text-xs text-gray-300">
                    Pozostało
                  </p>

                </div>

                <div className="rounded-lg bg-white/10 p-3 text-center">

                  <p className="text-2xl font-bold">
                    {dostarczono}
                  </p>

                  <p className="text-xs text-gray-300">
                    Gotowe
                  </p>

                </div>

              </div>

            </div>

            {/* LISTA DOSTAW */}

            <div className="mt-4 space-y-3">

              {ladowanie && (

                <div className="rounded-xl bg-white p-8 text-center">
                  Ładowanie...
                </div>

              )}

              {!ladowanie &&
                dostawy.map(
                  (dostawa, index) => (

                    <div
                      key={dostawa.id}
                      className={`rounded-xl bg-white p-5 shadow-sm ${
                        dostawa.status ===
                        "dostarczono"
                          ? "opacity-50"
                          : ""
                      }`}
                    >

                      {/* NUMER */}

                      <div className="flex items-center justify-between">

                        <div className="flex items-center gap-2">

                          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-900 text-lg font-bold text-white">
                            {dostawa.kolejnoscTrasy ??
                              index + 1}
                          </span>

                          <span className="rounded-lg bg-yellow-100 px-3 py-1 font-bold text-yellow-800">
                            🕐 {dostawa.godzina}
                          </span>

                        </div>

                        {dostawa.status ===
                          "dostarczono" && (

                          <span className="font-bold text-green-600">
                            ✓ Gotowe
                          </span>

                        )}

                      </div>

                      {/* KLIENT */}

                      <h3 className="mt-4 text-xl font-bold text-gray-900">
                        {dostawa.imieNazwisko}
                      </h3>

                      <p className="mt-2 text-lg text-gray-600">
                        📍 {dostawa.adres}
                      </p>

                      {dostawa.telefon && (

                        <a
                          href={`tel:${dostawa.telefon.replace(
                            /\s/g,
                            ""
                          )}`}
                          className="mt-2 block text-lg font-semibold text-blue-600"
                        >
                          📞 {dostawa.telefon}
                        </a>

                      )}

                      {/* UWAGI */}

                      {dostawa.uwagi && (

                        <div className="mt-3 rounded-lg bg-yellow-50 p-3">

                          <p className="text-sm font-bold text-yellow-800">
                            📝 Uwagi
                          </p>

                          <p className="mt-1 text-gray-700">
                            {dostawa.uwagi}
                          </p>

                        </div>

                      )}

                      {/* PRZYCISKI */}

                      <div className="mt-5 grid grid-cols-2 gap-2">

                        <button
                          onClick={() =>
                            otworzNawigacje(
                              dostawa.adres
                            )
                          }
                          className="rounded-xl bg-blue-600 p-4 text-base font-bold text-white"
                        >
                          🗺️ Nawiguj
                        </button>

                        {dostawa.status !==
                        "dostarczono" ? (

                          <button
                            onClick={() =>
                              zmienStatus(
                                dostawa.id,
                                "dostarczono"
                              )
                            }
                            className="rounded-xl bg-green-600 p-4 text-base font-bold text-white"
                          >
                            ✓ Dostarczono
                          </button>

                        ) : (

                          <button
                            onClick={() =>
                              zmienStatus(
                                dostawa.id,
                                "oczekuje"
                              )
                            }
                            className="rounded-xl bg-gray-200 p-4 text-base font-bold text-gray-700"
                          >
                            ↩ Cofnij
                          </button>

                        )}

                      </div>

                    </div>

                  )
                )}

              {!ladowanie &&
                dostawy.length === 0 && (

                  <div className="rounded-xl bg-white p-10 text-center shadow-sm">

                    <p className="text-4xl">
                      🎉
                    </p>

                    <h3 className="mt-3 text-xl font-bold text-gray-900">
                      Brak dostaw
                    </h3>

                    <p className="mt-2 text-gray-500">
                      Ten kierowca nie ma dzisiaj przypisanych dostaw.
                    </p>

                  </div>

                )}

            </div>

          </>
        )}

      </div>

    </main>
  );
}