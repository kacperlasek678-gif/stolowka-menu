"use client";

import { useEffect, useMemo, useState } from "react";

import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import {
  CalendarDays,
  Car,
  GripVertical,
  Loader2,
  MapPin,
  Route,
  UserRound,
  Users,
} from "lucide-react";

import { db } from "@/lib/firebase";

import SortableDelivery from "@/components/planowanie/SortableDelivery";

/* =========================================================
   TYPY
========================================================= */

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

type Trasa = {
  id: string;
  data: string;
  kierowcaId: string;
  kolejnosc: string[];
};

/* =========================================================
   DATY
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

  return mapaDni[
    new Date(
      rok,
      miesiac - 1,
      dzien
    ).getDay()
  ];
}

function formatujDate(data: string) {
  const [rok, miesiac, dzien] =
    data.split("-").map(Number);

  return new Intl.DateTimeFormat("pl-PL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(
    new Date(
      rok,
      miesiac - 1,
      dzien
    )
  );
}

/* =========================================================
   STREFA DROP KIEROWCY
========================================================= */

function StrefaKierowcy({
  kierowcaId,
  children,
}: {
  kierowcaId: string;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } =
    useDroppable({
      id: `kierowca-${kierowcaId}`,
      data: {
        type: "kierowca",
        kierowcaId,
      },
    });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-32 p-4 transition ${
        isOver
          ? "bg-yellow-50"
          : "bg-white"
      }`}
    >
      {children}
    </div>
  );
}

/* =========================================================
   GŁÓWNY KOMPONENT
========================================================= */

export default function PlanowaniePage() {
  const [klienci, setKlienci] =
    useState<Abonamentowicz[]>([]);

  const [kierowcy, setKierowcy] =
    useState<Kierowca[]>([]);

  const [trasy, setTrasy] =
    useState<Trasa[]>([]);

  const [
    wybranaData,
    setWybranaData,
  ] = useState(
    dzisiejszaData()
  );

  const [ladowanie, setLadowanie] =
    useState(true);

  const [zapisywanie, setZapisywanie] =
    useState(false);

  const [bladPobierania, setBladPobierania] =
    useState("");

  const [
    przeciaganyKlientId,
    setPrzeciaganyKlientId,
  ] = useState<string | null>(null);

  /* =======================================================
     SENSORY
  ======================================================= */

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),

    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    })
  );

  /* =======================================================
     FIREBASE - KLIENCI
  ======================================================= */

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(
        db,
        "abonamentowicze"
      ),
      (snapshot) => {
        const dane =
          snapshot.docs.map(
            (dokument) => ({
              id: dokument.id,
              ...dokument.data(),
            })
          ) as Abonamentowicz[];

        setKlienci(dane);

        setLadowanie(false);
      },
      (error) => {
        console.error(
          "Błąd klientów:",
          error
        );

        setBladPobierania(
          "Nie udało się pobrać abonamentowiczów. Odśwież stronę i zaloguj się ponownie."
        );

        setLadowanie(false);
      }
    );

    return () =>
      unsubscribe();
  }, []);

  /* =======================================================
     FIREBASE - KIEROWCY
  ======================================================= */

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(
        db,
        "kierowcy"
      ),
      (snapshot) => {
        const dane =
          snapshot.docs.map(
            (dokument) => ({
              id: dokument.id,
              ...dokument.data(),
            })
          ) as Kierowca[];

        dane.sort(
          (a, b) =>
            (
              a.imie || ""
            ).localeCompare(
              b.imie || ""
            )
        );

        setKierowcy(dane);
      }
    );

    return () =>
      unsubscribe();
  }, []);

  /* =======================================================
     FIREBASE - TRASY
  ======================================================= */

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(
        db,
        "trasy"
      ),
      (snapshot) => {
        const dane =
          snapshot.docs.map(
            (dokument) => ({
              id: dokument.id,
              ...dokument.data(),
            })
          ) as Trasa[];

        setTrasy(dane);
      }
    );

    return () =>
      unsubscribe();
  }, []);

  /* =======================================================
     DZIEŃ
  ======================================================= */

  const dzienTygodnia =
    pobierzDzienTygodnia(
      wybranaData
    );

  /* =======================================================
     KLIENCI NA DZIEŃ
  ======================================================= */

  const klienciNaDzien =
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
              a.godzina || ""
            ).localeCompare(
              b.godzina || ""
            )
        );
    }, [
      klienci,
      dzienTygodnia,
    ]);

  /* =======================================================
     KIEROWCY
  ======================================================= */

  const aktywniKierowcy =
    useMemo(() => {
      return kierowcy.filter(
        (kierowca) =>
          kierowca.aktywny
      );
    }, [kierowcy]);

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
     TRASY AKTYWNYCH KIEROWCÓW

     Stare trasy pozostawione po usuniętych lub wyłączonych
     kierowcach nie mogą ukrywać klientów w planowaniu.
  ======================================================= */

  const trasyAktywnychKierowcow =
    useMemo(() => {
      const aktywneId = new Set(
        aktywniKierowcy.map(
          (kierowca) => kierowca.id
        )
      );

      return trasyDnia.filter(
        (trasa) =>
          aktywneId.has(
            trasa.kierowcaId
          )
      );
    }, [
      trasyDnia,
      aktywniKierowcy,
    ]);

  /* =======================================================
     SPRAWDZENIE CZY KLIENT JEST W TRASIE
  ======================================================= */

  function znajdzTraseKlienta(
    klientId: string
  ) {
    return trasyAktywnychKierowcow.find(
      (trasa) =>
        trasa.kolejnosc?.includes(
          klientId
        )
    );
  }

  /* =======================================================
     DOSTAWY KIEROWCY
  ======================================================= */

  function pobierzDostawyKierowcy(
    kierowcaId: string
  ) {
    const trasa =
      trasyDnia.find(
        (element) =>
          element.kierowcaId ===
          kierowcaId
      );

    /*
     * Jeśli istnieje dzienna trasa,
     * używamy jej kolejności.
     */

    if (trasa) {
      return trasa.kolejnosc
        .map((klientId) =>
          klienciNaDzien.find(
            (klient) =>
              klient.id ===
              klientId
          )
        )
        .filter(
          (
            klient
          ): klient is Abonamentowicz =>
            Boolean(klient)
        );
    }

    /*
     * Jeśli trasa jeszcze nie istnieje,
     * pokazujemy klientów przypisanych
     * domyślnie do kierowcy.
     */

    return klienciNaDzien.filter(
      (klient) =>
        klient.kierowcaId ===
          kierowcaId &&
        !znajdzTraseKlienta(
          klient.id
        )
    );
  }

  /* =======================================================
     ZASOBNIK ABONAMENTÓW

     Klient trafia tu, gdy nie znajduje się na dziennej
     trasie. Domyślne przypisanie zachowujemy tylko dopóki
     dla tego kierowcy nie została jeszcze utworzona trasa
     na wybrany dzień. Dzięki temu usunięcie z trasy nie
     ukrywa klienta — można go od razu przywrócić.
  ======================================================= */

  const nieprzypisani =
    useMemo(() => {
      return klienciNaDzien.filter(
        (klient) => {
          const jestWTrasie =
            trasyAktywnychKierowcow.some(
              (trasa) =>
                trasa.kolejnosc?.includes(
                  klient.id
                )
            );

          if (jestWTrasie) {
            return false;
          }

          const maAktywnegoDomyslnegoKierowce =
            Boolean(
              klient.kierowcaId &&
              aktywniKierowcy.some(
                (kierowca) =>
                  kierowca.id ===
                  klient.kierowcaId
              )
            );

          if (!maAktywnegoDomyslnegoKierowce) {
            return true;
          }

          return trasyAktywnychKierowcow.some(
            (trasa) =>
              trasa.kierowcaId ===
              klient.kierowcaId
          );
        }
      );
    }, [
      klienciNaDzien,
      trasyAktywnychKierowcow,
      aktywniKierowcy,
    ]);

  /* =======================================================
     ZAPIS TRASY
  ======================================================= */

  async function zapiszTrase(
    kierowcaId: string,
    kolejnosc: string[]
  ) {
    const idDokumentu =
      `${wybranaData}_${kierowcaId}`;

    await setDoc(
      doc(
        db,
        "trasy",
        idDokumentu
      ),
      {
        data:
          wybranaData,

        kierowcaId,

        kolejnosc,

        zmieniono:
          new Date(),
      },
      {
        merge: true,
      }
    );
  }

  async function zapiszKierowceKlienta(
    klientId: string,
    kierowcaId: string
  ) {
    await updateDoc(
      doc(
        db,
        "abonamentowicze",
        klientId
      ),
      {
        kierowcaId,
        zmieniono: new Date(),
      }
    );
  }

  /* =======================================================
     UTWORZENIE PEŁNEJ TRASY
  ======================================================= */

  function pobierzIdTrasy(
    kierowcaId: string
  ) {
    return pobierzDostawyKierowcy(
      kierowcaId
    ).map(
      (klient) =>
        klient.id
    );
  }

  /* =======================================================
     RĘCZNE PRZYPISANIE
  ======================================================= */

  async function przypiszDoKierowcy(
    klientId: string,
    kierowcaId: string
  ) {
    try {
      setZapisywanie(true);

      /*
       * Usuwamy klienta
       * ze wszystkich tras dnia.
       */

      for (
        const trasa
        of trasyDnia
      ) {
        if (
          trasa.kolejnosc?.includes(
            klientId
          )
        ) {
          await zapiszTrase(
            trasa.kierowcaId,
            trasa.kolejnosc.filter(
              (id) =>
                id !== klientId
            )
          );
        }
      }

      /*
       * Pobieramy trasę docelową.
       */

      const obecnaKolejnosc =
        pobierzIdTrasy(
          kierowcaId
        ).filter(
          (id) =>
            id !== klientId
        );

      obecnaKolejnosc.push(
        klientId
      );

      await Promise.all([
        zapiszTrase(
          kierowcaId,
          obecnaKolejnosc
        ),
        zapiszKierowceKlienta(
          klientId,
          kierowcaId
        ),
      ]);
    } catch (error) {
      console.error(
        "Błąd przypisania:",
        error
      );

      alert(
        "Nie udało się przypisać dostawy."
      );
    } finally {
      setZapisywanie(false);
    }
  }

  /* =======================================================
     STRZAŁKI
  ======================================================= */

  async function przesun(
    kierowcaId: string,
    klientId: string,
    kierunek:
      | "gora"
      | "dol"
  ) {
    const kolejnosc =
      pobierzIdTrasy(
        kierowcaId
      );

    const index =
      kolejnosc.indexOf(
        klientId
      );

    if (index === -1) {
      return;
    }

    const nowyIndex =
      kierunek === "gora"
        ? index - 1
        : index + 1;

    if (
      nowyIndex < 0 ||
      nowyIndex >=
        kolejnosc.length
    ) {
      return;
    }

    const nowa =
      arrayMove(
        kolejnosc,
        index,
        nowyIndex
      );

    try {
      setZapisywanie(true);

      await zapiszTrase(
        kierowcaId,
        nowa
      );
    } catch (error) {
      console.error(error);

      alert(
        "Nie udało się zmienić kolejności."
      );
    } finally {
      setZapisywanie(false);
    }
  }

  /* =======================================================
     USUNIĘCIE Z TRASY
  ======================================================= */

  async function usunZTrasy(
    klientId: string,
    kierowcaId: string
  ) {
    try {
      setZapisywanie(true);

      const kolejnosc =
        pobierzIdTrasy(
          kierowcaId
        ).filter(
          (id) =>
            id !== klientId
        );

      await zapiszTrase(
        kierowcaId,
        kolejnosc
      );
    } catch (error) {
      console.error(error);

      alert(
        "Nie udało się usunąć dostawy z trasy."
      );
    } finally {
      setZapisywanie(false);
    }
  }

  /* =======================================================
     DRAG START
  ======================================================= */

  function rozpocznijPrzeciaganie(
    klientId: string
  ) {
    setPrzeciaganyKlientId(
      klientId
    );
  }

  /* =======================================================
     DRAG END
  ======================================================= */

  async function zakonczPrzeciaganie(
    event: DragEndEvent
  ) {
    const {
      active,
      over,
    } = event;

    setPrzeciaganyKlientId(
      null
    );

    if (!over) {
      return;
    }

    const klientId =
      String(active.id);

    /*
     * Szukamy kierowcy źródłowego.
     */

    let zrodlowyKierowcaId:
      | string
      | null = null;

    for (
      const kierowca
      of aktywniKierowcy
    ) {
      const lista =
        pobierzIdTrasy(
          kierowca.id
        );

      if (
        lista.includes(
          klientId
        )
      ) {
        zrodlowyKierowcaId =
          kierowca.id;

        break;
      }
    }

    /*
     * Ustalamy kierowcę docelowego.
     */

    let docelowyKierowcaId:
      | string
      | null = null;

    let docelowyKlientId:
      | string
      | null = null;

    if (
      String(
        over.id
      ).startsWith(
        "kierowca-"
      )
    ) {
      docelowyKierowcaId =
        String(
          over.id
        ).replace(
          "kierowca-",
          ""
        );
    } else {
      docelowyKlientId =
        String(
          over.id
        );

      for (
        const kierowca
        of aktywniKierowcy
      ) {
        if (
          pobierzIdTrasy(
            kierowca.id
          ).includes(
            docelowyKlientId
          )
        ) {
          docelowyKierowcaId =
            kierowca.id;

          break;
        }
      }
    }

    if (
      !zrodlowyKierowcaId ||
      !docelowyKierowcaId
    ) {
      return;
    }

    try {
      setZapisywanie(true);

      /*
       * TEN SAM KIEROWCA
       */

      if (
        zrodlowyKierowcaId ===
        docelowyKierowcaId
      ) {
        if (
          !docelowyKlientId
        ) {
          return;
        }

        const lista =
          pobierzIdTrasy(
            zrodlowyKierowcaId
          );

        const staryIndex =
          lista.indexOf(
            klientId
          );

        const nowyIndex =
          lista.indexOf(
            docelowyKlientId
          );

        if (
          staryIndex === -1 ||
          nowyIndex === -1 ||
          staryIndex ===
            nowyIndex
        ) {
          return;
        }

        const nowaLista =
          arrayMove(
            lista,
            staryIndex,
            nowyIndex
          );

        await zapiszTrase(
          zrodlowyKierowcaId,
          nowaLista
        );

        return;
      }

      /*
       * INNY KIEROWCA
       */

      const listaZrodlowa =
        pobierzIdTrasy(
          zrodlowyKierowcaId
        ).filter(
          (id) =>
            id !== klientId
        );

      const listaDocelowa =
        pobierzIdTrasy(
          docelowyKierowcaId
        ).filter(
          (id) =>
            id !== klientId
        );

      /*
       * Jeśli upuszczamy
       * na konkretnego klienta,
       * wstawiamy przed nim.
       */

      if (
        docelowyKlientId
      ) {
        const index =
          listaDocelowa.indexOf(
            docelowyKlientId
          );

        if (index >= 0) {
          listaDocelowa.splice(
            index,
            0,
            klientId
          );
        } else {
          listaDocelowa.push(
            klientId
          );
        }
      } else {
        /*
         * Upuszczenie na pustą
         * przestrzeń kierowcy.
         */

        listaDocelowa.push(
          klientId
        );
      }

      await Promise.all([
        zapiszTrase(
          zrodlowyKierowcaId,
          listaZrodlowa
        ),

        zapiszTrase(
          docelowyKierowcaId,
          listaDocelowa
        ),

        zapiszKierowceKlienta(
          klientId,
          docelowyKierowcaId
        ),
      ]);
    } catch (error) {
      console.error(
        "Błąd drag & drop:",
        error
      );

      alert(
        "Nie udało się przenieść dostawy."
      );
    } finally {
      setZapisywanie(false);
    }
  }

  /* =======================================================
     PRZECIĄGANY KLIENT
  ======================================================= */

  const przeciaganyKlient =
    przeciaganyKlientId
      ? klienciNaDzien.find(
          (klient) =>
            klient.id ===
            przeciaganyKlientId
        )
      : null;

  /* =======================================================
     LOADING
  ======================================================= */

  if (ladowanie) {
    return (
      <main className="flex min-h-[calc(100vh-5rem)] items-center justify-center">

        <div className="text-center">

          <Loader2
            size={40}
            className="mx-auto animate-spin text-yellow-500"
          />

          <p className="mt-4 font-semibold text-gray-700">
            Ładowanie planowania...
          </p>

        </div>

      </main>
    );
  }

  if (bladPobierania) {
    return (
      <main className="mx-auto max-w-2xl p-5 sm:p-8">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
          <h1 className="text-xl font-black">Nie udało się załadować planowania</h1>
          <p className="mt-2">{bladPobierania}</p>
        </div>
      </main>
    );
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <main className="p-4 sm:p-6 lg:p-8">

      <div className="mx-auto max-w-7xl">

        {/* NAGŁÓWEK */}

        <div className="mb-8">

          <p className="text-sm font-semibold text-yellow-600">
            Jak u Mamy
          </p>

          <h1 className="mt-1 text-3xl font-bold text-gray-900">
            Planowanie tras
          </h1>

          <p className="mt-2 text-gray-500">
            Przeciągaj dostawy między
            kierowcami i ustawiaj kolejność
            trasy.
          </p>

        </div>

        {/* DATA */}

        <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

            <div className="flex items-center gap-4">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-100 text-yellow-700">

                <CalendarDays
                  size={24}
                />

              </div>

              <div>

                <p className="text-sm font-semibold text-gray-500">
                  Planowanie na dzień
                </p>

                <h2 className="mt-1 text-xl font-bold capitalize text-gray-900">
                  {formatujDate(
                    wybranaData
                  )}
                </h2>

              </div>

            </div>

            <input
              type="date"
              value={
                wybranaData
              }
              onChange={(e) =>
                setWybranaData(
                  e.target.value
                )
              }
              className="rounded-xl border border-gray-300 bg-white px-4 py-3 font-semibold text-gray-900"
            />

          </div>

        </section>

        {/* STATYSTYKI */}

        <div className="mb-6 grid gap-4 sm:grid-cols-3">

          <div className="rounded-2xl border bg-white p-5 shadow-sm">

            <Users
              size={24}
              className="text-gray-400"
            />

            <p className="mt-4 text-3xl font-bold">
              {
                klienciNaDzien.length
              }
            </p>

            <p className="text-sm text-gray-500">
              Dostaw
            </p>

          </div>

          <div className="rounded-2xl border border-orange-200 bg-orange-50 p-5">

            <UserRound
              size={24}
              className="text-orange-500"
            />

            <p className="mt-4 text-3xl font-bold text-orange-700">
              {
                nieprzypisani.length
              }
            </p>

            <p className="text-sm text-orange-600">
              W zasobniku
            </p>

          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">

            <Car
              size={24}
              className="text-gray-400"
            />

            <p className="mt-4 text-3xl font-bold">
              {
                aktywniKierowcy.length
              }
            </p>

            <p className="text-sm text-gray-500">
              Kierowców
            </p>

          </div>

        </div>

        {/* ZASOBNIK ABONAMENTÓW */}

        <section className="mb-8 rounded-2xl border border-orange-200 bg-orange-50 p-5">

            <h2 className="font-bold text-orange-800">
              📦 Zasobnik abonamentów
            </h2>

            <p className="mt-1 text-sm text-orange-700">
              Usunięte z trasy lub nieprzypisane abonamenty. Wybierz kierowcę, aby przywrócić je do planu.
            </p>

            {nieprzypisani.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed border-orange-300 bg-white/70 p-4 text-sm font-medium text-orange-700">
                Zasobnik jest pusty.
              </p>
            ) : (
            <div className="mt-4 space-y-3">

              {nieprzypisani.map(
                (klient) => (
                  <div
                    key={
                      klient.id
                    }
                    className="flex flex-col justify-between gap-4 rounded-xl bg-white p-4 sm:flex-row sm:items-center"
                  >

                    <div>

                      <p className="font-bold">
                        {
                          klient.imieNazwisko
                        }
                      </p>

                      <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">

                        <MapPin
                          size={14}
                        />

                        {
                          klient.adres
                        }

                      </p>

                    </div>

                    <select
                      defaultValue=""
                      disabled={
                        zapisywanie
                      }
                      onChange={(e) => {
                        if (
                          e.target
                            .value
                        ) {
                          przypiszDoKierowcy(
                            klient.id,
                            e.target
                              .value
                          );
                        }
                      }}
                      className="rounded-xl border px-4 py-3 font-semibold"
                    >

                      <option value="">
                        Przywróć do kierowcy
                      </option>

                      {aktywniKierowcy.map(
                        (
                          kierowca
                        ) => (
                          <option
                            key={
                              kierowca.id
                            }
                            value={
                              kierowca.id
                            }
                          >
                            {
                              kierowca.imie
                            }
                          </option>
                        )
                      )}

                    </select>

                  </div>
                )
              )}

            </div>
            )}

        </section>

        {/* DRAG & DROP */}

        <DndContext
          sensors={sensors}
          collisionDetection={
            closestCenter
          }
          onDragStart={(event) =>
            rozpocznijPrzeciaganie(
              String(
                event.active.id
              )
            )
          }
          onDragEnd={
            zakonczPrzeciaganie
          }
          onDragCancel={() =>
            setPrzeciaganyKlientId(
              null
            )
          }
        >

          <div className="grid gap-5 xl:grid-cols-2">

            {aktywniKierowcy.map(
              (kierowca) => {

                const dostawy =
                  pobierzDostawyKierowcy(
                    kierowca.id
                  );

                return (
                  <div
                    key={
                      kierowca.id
                    }
                    className="overflow-hidden rounded-2xl border bg-white shadow-sm"
                  >

                    {/* KIEROWCA */}

                    <div className="flex items-center justify-between bg-gray-950 p-5 text-white">

                      <div className="flex items-center gap-3">

                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-400 text-black">

                          <Car
                            size={22}
                          />

                        </div>

                        <div>

                          <h3 className="font-bold">
                            {
                              kierowca.imie
                            }
                          </h3>

                          <p className="text-sm text-gray-400">
                            {
                              dostawy.length
                            }{" "}
                            dostaw
                          </p>

                        </div>

                      </div>

                      <Route
                        size={22}
                        className="text-gray-500"
                      />

                    </div>

                    {/* DROP ZONE */}

                    <StrefaKierowcy
                      kierowcaId={
                        kierowca.id
                      }
                    >

                      <SortableContext
                        items={dostawy.map(
                          (
                            dostawa
                          ) =>
                            dostawa.id
                        )}
                        strategy={
                          verticalListSortingStrategy
                        }
                      >

                        {dostawy.length >
                        0 ? (

                          <div className="space-y-3">

                            {dostawy.map(
                              (
                                klient,
                                index
                              ) => (
                                <SortableDelivery
                                  key={
                                    klient.id
                                  }
                                  id={
                                    klient.id
                                  }
                                  index={
                                    index
                                  }
                                  total={
                                    dostawy.length
                                  }
                                  klient={
                                    klient
                                  }
                                  disabled={
                                    zapisywanie
                                  }
                                  onMoveUp={() =>
                                    przesun(
                                      kierowca.id,
                                      klient.id,
                                      "gora"
                                    )
                                  }
                                  onMoveDown={() =>
                                    przesun(
                                      kierowca.id,
                                      klient.id,
                                      "dol"
                                    )
                                  }
                                  onRemove={() =>
                                    usunZTrasy(
                                      klient.id,
                                      kierowca.id
                                    )
                                  }
                                />
                              )
                            )}

                          </div>

                        ) : (

                          <div className="flex min-h-28 items-center justify-center rounded-xl border-2 border-dashed border-gray-200 text-center">

                            <div>

                              <Car
                                size={28}
                                className="mx-auto text-gray-300"
                              />

                              <p className="mt-2 text-sm font-semibold text-gray-400">
                                Przeciągnij tutaj dostawę
                              </p>

                            </div>

                          </div>

                        )}

                      </SortableContext>

                    </StrefaKierowcy>

                  </div>
                );
              }
            )}

          </div>

          {/* DRAG OVERLAY */}

          <DragOverlay>

            {przeciaganyKlient && (

              <div className="w-80 rotate-2 rounded-xl border border-yellow-400 bg-white p-4 shadow-2xl">

                <div className="flex gap-3">

                  <GripVertical
                    className="text-gray-400"
                  />

                  <div>

                    <p className="font-bold text-gray-900">
                      {
                        przeciaganyKlient.imieNazwisko
                      }
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      📍{" "}
                      {
                        przeciaganyKlient.adres
                      }
                    </p>

                  </div>

                </div>

              </div>

            )}

          </DragOverlay>

        </DndContext>

      </div>

    </main>
  );
}
