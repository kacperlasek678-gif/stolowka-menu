"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  collection,
  onSnapshot,
} from "firebase/firestore";
import {
  Truck,
  CircleCheckBig,
  Clock3,
  Car,
  Users,
  MapPinned,
  ArrowRight,
  Loader2,
} from "lucide-react";

import { db } from "@/lib/firebase";
import AdminGuard from "@/components/auth/AdminGuard";
import StatCard from "@/components/ui/StatCard";

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

function dzisiejszaData() {
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

function pobierzDzienTygodnia(data: string) {
  const [rok, miesiac, dzien] =
    data.split("-").map(Number);

  const obiektDaty = new Date(
    rok,
    miesiac - 1,
    dzien
  );

  return mapaDni[obiektDaty.getDay()];
}

const quickActions = [
  {
    title: "Dostawy",
    description:
      "Zarządzaj dzisiejszymi dostawami",
    href: "/dostawy",
    icon: Truck,
  },
  {
    title: "Klienci",
    description:
      "Lista abonamentowiczów i adresów",
    href: "/dostawy/klienci",
    icon: Users,
  },
  {
    title: "Kierowcy",
    description:
      "Zarządzaj kierowcami",
    href: "/dostawy/kierowcy",
    icon: Car,
  },
  {
    title: "Planowanie tras",
    description:
      "Ustal kolejność dzisiejszych dostaw",
    href: "/dostawy/planowanie",
    icon: MapPinned,
  },
];

export default function DashboardPage() {
  return (
    <AdminGuard>
      <DashboardContent />
    </AdminGuard>
  );
}

function DashboardContent() {
  const [klienci, setKlienci] =
    useState<Abonamentowicz[]>([]);

  const [kierowcy, setKierowcy] =
    useState<Kierowca[]>([]);

  const [statusy, setStatusy] =
    useState<StatusDostawy[]>([]);

  const [ladowanieKlientow, setLadowanieKlientow] =
    useState(true);

  const [ladowanieKierowcow, setLadowanieKierowcow] =
    useState(true);

  const [ladowanieStatusow, setLadowanieStatusow] =
    useState(true);

  const dzisiaj = dzisiejszaData();

  const dzienTygodnia =
    pobierzDzienTygodnia(dzisiaj);

  /*
   * ABONAMENTOWICZE
   */

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
        setLadowanieKlientow(false);
      },
      (error) => {
        console.error(
          "Błąd pobierania abonamentowiczów:",
          error
        );

        setLadowanieKlientow(false);
      }
    );

    return () => unsubscribe();
  }, []);

  /*
   * KIEROWCY
   */

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
          (a.imie || "").localeCompare(
            b.imie || ""
          )
        );

        setKierowcy(dane);
        setLadowanieKierowcow(false);
      },
      (error) => {
        console.error(
          "Błąd pobierania kierowców:",
          error
        );

        setLadowanieKierowcow(false);
      }
    );

    return () => unsubscribe();
  }, []);

  /*
   * STATUSY DOSTAW
   */

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
        setLadowanieStatusow(false);
      },
      (error) => {
        console.error(
          "Błąd pobierania statusów:",
          error
        );

        setLadowanieStatusow(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const ladowanie =
    ladowanieKlientow ||
    ladowanieKierowcow ||
    ladowanieStatusow;

  /*
   * KLIENCI Z DOSTAWĄ DZISIAJ
   */

  const dzisiejsiKlienci = useMemo(() => {
    return klienci.filter(
      (klient) =>
        klient.aktywny &&
        klient.dni?.includes(
          dzienTygodnia
        )
    );
  }, [klienci, dzienTygodnia]);

  /*
   * DZISIEJSZE STATUSY
   */

  const dzisiejszeStatusy = useMemo(() => {
    return statusy.filter(
      (status) =>
        status.data === dzisiaj
    );
  }, [statusy, dzisiaj]);

  /*
   * POBIERANIE STATUSU KLIENTA
   */

  const pobierzStatus = useCallback((
    klientId: string
  ): Status => {
    const znaleziony =
      dzisiejszeStatusy.find(
        (status) =>
          status.klientId === klientId
      );

    return (
      znaleziony?.status ||
      "oczekuje"
    );
  }, [dzisiejszeStatusy]);

  /*
   * DZISIEJSZE DOSTAWY
   */

  const dzisiejszeDostawy =
    useMemo(() => {
      return dzisiejsiKlienci.map(
        (klient) => ({
          ...klient,
          status: pobierzStatus(
            klient.id
          ),
        })
      );
    }, [
      dzisiejsiKlienci,
      pobierzStatus,
    ]);

  /*
   * STATYSTYKI
   */

  const wszystkieDostawy =
    dzisiejszeDostawy.length;

  const dostarczone =
    dzisiejszeDostawy.filter(
      (dostawa) =>
        dostawa.status ===
        "dostarczono"
    ).length;

  const wTrasie =
    dzisiejszeDostawy.filter(
      (dostawa) =>
        dostawa.status ===
        "wTrasie"
    ).length;

  const pozostalo =
    wszystkieDostawy -
    dostarczone;

  const aktywniKierowcy =
    kierowcy.filter(
      (kierowca) =>
        kierowca.aktywny
    );

  const procent =
    wszystkieDostawy > 0
      ? Math.round(
          (dostarczone /
            wszystkieDostawy) *
            100
        )
      : 0;

  /*
   * STATYSTYKI KIEROWCÓW
   */

  const postepKierowcow =
    aktywniKierowcy.map(
      (kierowca) => {
        const dostawyKierowcy =
          dzisiejszeDostawy.filter(
            (dostawa) =>
              dostawa.kierowcaId ===
              kierowca.id
          );

        const dostarczoneKierowcy =
          dostawyKierowcy.filter(
            (dostawa) =>
              dostawa.status ===
              "dostarczono"
          ).length;

        const wTrasieKierowcy =
          dostawyKierowcy.filter(
            (dostawa) =>
              dostawa.status ===
              "wTrasie"
          ).length;

        const procentKierowcy =
          dostawyKierowcy.length > 0
            ? Math.round(
                (dostarczoneKierowcy /
                  dostawyKierowcy.length) *
                  100
              )
            : 0;

        return {
          ...kierowca,
          wszystkie:
            dostawyKierowcy.length,
          dostarczone:
            dostarczoneKierowcy,
          wTrasie:
            wTrasieKierowcy,
          procent:
            procentKierowcy,
        };
      }
    );

  /*
   * NIEPRZYPISANE
   */

  const nieprzypisane =
    dzisiejszeDostawy.filter(
      (dostawa) =>
        !dostawa.kierowcaId
    ).length;

  if (ladowanie) {
    return (
      <main className="flex min-h-[calc(100vh-5rem)] items-center justify-center p-6">
        <div className="text-center">
          <Loader2
            size={40}
            className="mx-auto animate-spin text-yellow-500"
          />

          <p className="mt-4 font-semibold text-gray-700">
            Ładowanie dashboardu...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">

        {/* TYTUŁ */}

        <div className="mb-8">
          <p className="text-sm font-semibold text-yellow-600">
            Jak u Mamy
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900">
            Dashboard
          </h1>

          <p className="mt-2 text-gray-500">
            Podgląd dzisiejszych dostaw
            i pracy kierowców w czasie
            rzeczywistym.
          </p>
        </div>

        {/* STATYSTYKI */}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Dostawy dzisiaj"
            value={wszystkieDostawy}
            icon={Truck}
            description="Wszystkie zaplanowane"
          />

          <StatCard
            title="Dostarczono"
            value={dostarczone}
            icon={CircleCheckBig}
            description={`${procent}% wszystkich dostaw`}
          />

          <StatCard
            title="Pozostało"
            value={pozostalo}
            icon={Clock3}
            description={
              wTrasie > 0
                ? `${wTrasie} aktualnie w trasie`
                : "Brak dostaw w trasie"
            }
          />

          <StatCard
            title="Kierowcy"
            value={
              aktywniKierowcy.length
            }
            icon={Car}
            description="Aktywni kierowcy"
          />
        </div>

        {/* GŁÓWNA SEKCJA */}

        <div className="mt-8 grid gap-6 xl:grid-cols-[2fr_1fr]">

          {/* POSTĘP KIEROWCÓW */}

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Postęp kierowców
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Dzisiejszy status
                  realizacji tras.
                </p>
              </div>

              <Car
                className="text-gray-400"
                size={24}
              />
            </div>

            <div className="mt-6 space-y-5">

              {postepKierowcow.map(
                (kierowca) => (
                  <div
                    key={kierowca.id}
                    className="rounded-xl border border-gray-100 bg-gray-50 p-4"
                  >

                    <div className="flex items-center justify-between gap-4">

                      <div>
                        <p className="font-bold text-gray-900">
                          🚗{" "}
                          {kierowca.imie}
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                          {
                            kierowca.dostarczone
                          }{" "}
                          /{" "}
                          {
                            kierowca.wszystkie
                          }{" "}
                          dostarczonych
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">
                          {
                            kierowca.procent
                          }
                          %
                        </p>

                        {kierowca.wTrasie >
                          0 && (
                          <p className="text-xs font-semibold text-blue-600">
                            {
                              kierowca.wTrasie
                            }{" "}
                            w trasie
                          </p>
                        )}
                      </div>

                    </div>

                    <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-gray-200">

                      <div
                        className="h-full rounded-full bg-yellow-400 transition-all duration-500"
                        style={{
                          width: `${kierowca.procent}%`,
                        }}
                      />

                    </div>

                  </div>
                )
              )}

              {postepKierowcow.length ===
                0 && (
                <div className="rounded-xl bg-gray-50 p-8 text-center">

                  <Car
                    size={34}
                    className="mx-auto text-gray-300"
                  />

                  <p className="mt-3 font-semibold text-gray-700">
                    Brak aktywnych
                    kierowców
                  </p>

                </div>
              )}

            </div>

            {nieprzypisane > 0 && (
              <div className="mt-5 rounded-xl border border-orange-200 bg-orange-50 p-4">

                <p className="font-bold text-orange-700">
                  ⚠️ {nieprzypisane}{" "}
                  {nieprzypisane === 1
                    ? "dostawa nie ma"
                    : "dostaw nie ma"}{" "}
                  przypisanego kierowcy
                </p>

                <Link
                  href="/dostawy/planowanie"
                  className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-orange-700 hover:underline"
                >
                  Przejdź do planowania
                  <ArrowRight
                    size={15}
                  />
                </Link>

              </div>
            )}

          </section>

          {/* POSTĘP DNIA */}

          <section className="rounded-2xl bg-gray-950 p-6 text-white shadow-sm">

            <p className="text-sm font-semibold text-yellow-400">
              Dzisiejszy postęp
            </p>

            <p className="mt-4 text-5xl font-bold">
              {procent}%
            </p>

            <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10">

              <div
                className="h-full rounded-full bg-yellow-400 transition-all duration-500"
                style={{
                  width: `${procent}%`,
                }}
              />

            </div>

            <div className="mt-6 space-y-3 text-sm">

              <div className="flex justify-between text-gray-300">
                <span>
                  Wszystkie
                </span>

                <strong className="text-white">
                  {wszystkieDostawy}
                </strong>
              </div>

              <div className="flex justify-between text-gray-300">
                <span>
                  Dostarczono
                </span>

                <strong className="text-green-400">
                  {dostarczone}
                </strong>
              </div>

              <div className="flex justify-between text-gray-300">
                <span>
                  W trasie
                </span>

                <strong className="text-blue-400">
                  {wTrasie}
                </strong>
              </div>

              <div className="flex justify-between text-gray-300">
                <span>
                  Pozostało
                </span>

                <strong className="text-yellow-400">
                  {pozostalo}
                </strong>
              </div>

            </div>

            <Link
              href="/dostawy"
              className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-yellow-400 px-4 py-3 text-sm font-bold text-gray-950 transition hover:bg-yellow-300"
            >
              Przejdź do dostaw
              <ArrowRight
                size={18}
              />
            </Link>

          </section>

        </div>

        {/* SZYBKI DOSTĘP */}

        <section className="mt-8">

          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              Szybki dostęp
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Najczęściej używane
              moduły systemu.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

            {quickActions.map(
              (item) => {
                const Icon =
                  item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-yellow-300 hover:shadow-md"
                  >

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-gray-700 transition group-hover:bg-yellow-400 group-hover:text-gray-950">
                      <Icon
                        size={21}
                      />
                    </div>

                    <h3 className="mt-4 font-bold text-gray-900">
                      {item.title}
                    </h3>

                    <p className="mt-1 text-sm leading-5 text-gray-500">
                      {
                        item.description
                      }
                    </p>

                    <div className="mt-4 flex items-center gap-1 text-sm font-semibold text-gray-700 group-hover:text-yellow-600">
                      Otwórz

                      <ArrowRight
                        size={16}
                      />
                    </div>

                  </Link>
                );
              }
            )}

          </div>

        </section>

      </div>
    </main>
  );
}
