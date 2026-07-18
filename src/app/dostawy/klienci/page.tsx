"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

type Kierowca = {
  id: string;
  imie: string;
  telefon?: string;
  aktywny: boolean;
};

type Abonamentowicz = {
  id: string;
  imieNazwisko: string;
  adres: string;
  telefon: string;
  godzina: string;
  dni: string[];
  uwagi: string;
  aktywny: boolean;
  kierowcaId?: string;
  kolejnoscTrasy?: number | null;
};

const dniTygodnia = [
  { id: "pon", nazwa: "Pon" },
  { id: "wt", nazwa: "Wt" },
  { id: "sr", nazwa: "Śr" },
  { id: "czw", nazwa: "Czw" },
  { id: "pt", nazwa: "Pt" },
  { id: "sob", nazwa: "Sob" },
  { id: "nd", nazwa: "Nd" },
];

const domyslneDni = ["pon", "wt", "sr", "czw", "pt"];

export default function KlienciPage() {
  const [klienci, setKlienci] = useState<Abonamentowicz[]>([]);
  const [kierowcy, setKierowcy] = useState<Kierowca[]>([]);

  const [wyszukiwanie, setWyszukiwanie] = useState("");

  const [pokazFormularz, setPokazFormularz] = useState(false);
  const [edytowanyId, setEdytowanyId] = useState<string | null>(null);
  const [zapisywanie, setZapisywanie] = useState(false);

  const [imieNazwisko, setImieNazwisko] = useState("");
  const [adres, setAdres] = useState("");
  const [telefon, setTelefon] = useState("");
  const [godzina, setGodzina] = useState("12:00");
  const [uwagi, setUwagi] = useState("");
  const [dni, setDni] = useState<string[]>(domyslneDni);

  const [kierowcaId, setKierowcaId] = useState("");
  const [kolejnoscTrasy, setKolejnoscTrasy] = useState("");

  // POBIERANIE ABONAMENTOWICZÓW

  useEffect(() => {
    const q = query(
      collection(db, "abonamentowicze"),
      orderBy("imieNazwisko")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const dane = snapshot.docs.map((dokument) => ({
          id: dokument.id,
          ...dokument.data(),
        })) as Abonamentowicz[];

        setKlienci(dane);
      },
      (error) => {
        console.error("Błąd pobierania abonamentowiczów:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  // POBIERANIE KIEROWCÓW

  useEffect(() => {
    const q = query(
      collection(db, "kierowcy"),
      orderBy("imie")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const dane = snapshot.docs.map((dokument) => ({
          id: dokument.id,
          ...dokument.data(),
        })) as Kierowca[];

        setKierowcy(dane);
      },
      (error) => {
        console.error("Błąd pobierania kierowców:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  // WYSZUKIWANIE

  const przefiltrowaniKlienci = useMemo(() => {
    const szukaj = wyszukiwanie.toLowerCase().trim();

    if (!szukaj) {
      return klienci;
    }

    return klienci.filter((klient) => {
      const kierowca = kierowcy.find(
        (k) => k.id === klient.kierowcaId
      );

      return (
        klient.imieNazwisko?.toLowerCase().includes(szukaj) ||
        klient.adres?.toLowerCase().includes(szukaj) ||
        klient.telefon?.toLowerCase().includes(szukaj) ||
        kierowca?.imie?.toLowerCase().includes(szukaj)
      );
    });
  }, [klienci, kierowcy, wyszukiwanie]);

  function znajdzKierowce(id?: string) {
    if (!id) {
      return null;
    }

    return kierowcy.find((kierowca) => kierowca.id === id) || null;
  }

  function zmienDzien(dzien: string) {
    setDni((poprzednie) =>
      poprzednie.includes(dzien)
        ? poprzednie.filter((d) => d !== dzien)
        : [...poprzednie, dzien]
    );
  }

  function wyczyscFormularz() {
    setImieNazwisko("");
    setAdres("");
    setTelefon("");
    setGodzina("12:00");
    setUwagi("");
    setDni(domyslneDni);
    setKierowcaId("");
    setKolejnoscTrasy("");
    setEdytowanyId(null);
  }

  function otworzDodawanie() {
    wyczyscFormularz();
    setPokazFormularz(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function rozpocznijEdycje(klient: Abonamentowicz) {
    setEdytowanyId(klient.id);

    setImieNazwisko(klient.imieNazwisko || "");
    setAdres(klient.adres || "");
    setTelefon(klient.telefon || "");
    setGodzina(klient.godzina || "12:00");
    setUwagi(klient.uwagi || "");
    setDni(klient.dni || []);
    setKierowcaId(klient.kierowcaId || "");

    setKolejnoscTrasy(
      klient.kolejnoscTrasy?.toString() || ""
    );

    setPokazFormularz(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function zamknijFormularz() {
    setPokazFormularz(false);
    wyczyscFormularz();
  }

  async function zapiszKlienta(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!imieNazwisko.trim()) {
      alert("Podaj imię i nazwisko.");
      return;
    }

    if (!adres.trim()) {
      alert("Podaj adres dostawy.");
      return;
    }

    if (dni.length === 0) {
      alert("Wybierz przynajmniej jeden dzień dostawy.");
      return;
    }

    if (
      kolejnoscTrasy &&
      Number(kolejnoscTrasy) < 1
    ) {
      alert("Kolejność trasy musi być większa od 0.");
      return;
    }

    try {
      setZapisywanie(true);

      const daneKlienta = {
        imieNazwisko: imieNazwisko.trim(),
        adres: adres.trim(),
        telefon: telefon.trim(),
        godzina,
        dni,
        uwagi: uwagi.trim(),
        kierowcaId: kierowcaId || "",
        kolejnoscTrasy: kolejnoscTrasy
          ? Number(kolejnoscTrasy)
          : null,
      };

      if (edytowanyId) {
        await updateDoc(
          doc(db, "abonamentowicze", edytowanyId),
          {
            ...daneKlienta,
            zmieniono: serverTimestamp(),
          }
        );
      } else {
        await addDoc(
          collection(db, "abonamentowicze"),
          {
            ...daneKlienta,
            aktywny: true,
            utworzono: serverTimestamp(),
          }
        );
      }

      zamknijFormularz();
    } catch (error) {
      console.error(error);

      alert("Nie udało się zapisać abonamentowicza.");
    } finally {
      setZapisywanie(false);
    }
  }

  async function zmienAktywnosc(
    id: string,
    aktualnyStatus: boolean
  ) {
    try {
      await updateDoc(
        doc(db, "abonamentowicze", id),
        {
          aktywny: !aktualnyStatus,
          zmieniono: serverTimestamp(),
        }
      );
    } catch (error) {
      console.error(error);

      alert(
        "Nie udało się zmienić statusu abonamentowicza."
      );
    }
  }

  async function usunKlienta(klient: Abonamentowicz) {
    const potwierdzenie = window.confirm(
      `Czy na pewno chcesz usunąć abonamentowicza ${klient.imieNazwisko}?`
    );

    if (!potwierdzenie) {
      return;
    }

    try {
      await deleteDoc(
        doc(db, "abonamentowicze", klient.id)
      );
    } catch (error) {
      console.error(error);

      alert("Nie udało się usunąć abonamentowicza.");
    }
  }

  return (
    <main className="min-h-screen bg-gray-100">

      <header className="bg-yellow-400 shadow-sm">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-4 px-5 py-5 sm:flex-row sm:items-center">

          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Jak u Mamy
            </h1>

            <p className="text-gray-700">
              Baza abonamentowiczów
            </p>
          </div>

          <div className="flex flex-wrap gap-2">

            <Link
              href="/dostawy/kierowcy"
              className="rounded-lg bg-white px-5 py-3 text-center font-bold text-gray-900"
            >
              🚗 Kierowcy
            </Link>

            <Link
              href="/dostawy"
              className="rounded-lg bg-gray-900 px-5 py-3 text-center font-bold text-white"
            >
              ← Panel dostaw
            </Link>

          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl p-5">

        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">

          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Abonamentowicze
            </h2>

            <p className="mt-1 text-gray-500">
              Łącznie w bazie: {klienci.length}
            </p>
          </div>

          <button
            onClick={
              pokazFormularz && !edytowanyId
                ? zamknijFormularz
                : otworzDodawanie
            }
            className="rounded-lg bg-yellow-400 px-5 py-3 font-bold text-gray-900"
          >
            {pokazFormularz && !edytowanyId
              ? "✕ Zamknij"
              : "+ Dodaj abonamentowicza"}
          </button>

        </div>

        {/* FORMULARZ */}

        {pokazFormularz && (
          <form
            onSubmit={zapiszKlienta}
            className="mb-6 rounded-xl bg-white p-5 shadow-sm"
          >

            <div className="mb-5 flex items-center justify-between">

              <h3 className="text-xl font-bold text-gray-900">
                {edytowanyId
                  ? "Edytuj abonamentowicza"
                  : "Nowy abonamentowicz"}
              </h3>

              <button
                type="button"
                onClick={zamknijFormularz}
                className="rounded-lg bg-gray-100 px-3 py-2 font-semibold text-gray-600"
              >
                ✕
              </button>

            </div>

            <div className="grid gap-4 md:grid-cols-2">

              <Pole
                label="Imię i nazwisko"
                value={imieNazwisko}
                onChange={setImieNazwisko}
                placeholder="Jan Kowalski"
              />

              <Pole
                label="Telefon"
                value={telefon}
                onChange={setTelefon}
                placeholder="600 123 456"
              />

              <Pole
                label="Adres dostawy"
                value={adres}
                onChange={setAdres}
                placeholder="ul. Mickiewicza 15, Słupsk"
              />

              <div>
                <label className="mb-1 block font-semibold text-gray-700">
                  Godzina dostawy
                </label>

                <input
                  type="time"
                  value={godzina}
                  onChange={(e) =>
                    setGodzina(e.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 p-3 text-gray-900"
                />
              </div>

              {/* KIEROWCA */}

              <div>

                <label className="mb-1 block font-semibold text-gray-700">
                  🚗 Przypisany kierowca
                </label>

                <select
                  value={kierowcaId}
                  onChange={(e) =>
                    setKierowcaId(e.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-900"
                >

                  <option value="">
                    Nieprzypisany
                  </option>

                  {kierowcy.map((kierowca) => (
                    <option
                      key={kierowca.id}
                      value={kierowca.id}
                    >
                      {kierowca.imie}
                      {!kierowca.aktywny
                        ? " (nieaktywny)"
                        : ""}
                    </option>
                  ))}

                </select>

              </div>

              {/* KOLEJNOŚĆ */}

              <div>

                <label className="mb-1 block font-semibold text-gray-700">
                  🔢 Kolejność na trasie
                </label>

                <input
                  type="number"
                  min="1"
                  step="1"
                  value={kolejnoscTrasy}
                  onChange={(e) =>
                    setKolejnoscTrasy(e.target.value)
                  }
                  placeholder="Np. 1"
                  className="w-full rounded-lg border border-gray-300 p-3 text-gray-900"
                />

                <p className="mt-1 text-sm text-gray-500">
                  Np. 1 oznacza pierwszą dostawę kierowcy.
                </p>

              </div>

            </div>

            {/* DNI */}

            <div className="mt-5">

              <p className="mb-2 font-semibold text-gray-700">
                Dni dostawy
              </p>

              <div className="flex flex-wrap gap-2">

                {dniTygodnia.map((dzien) => {
                  const wybrany = dni.includes(dzien.id);

                  return (
                    <button
                      key={dzien.id}
                      type="button"
                      onClick={() =>
                        zmienDzien(dzien.id)
                      }
                      className={`rounded-lg px-4 py-2 font-semibold ${
                        wybrany
                          ? "bg-yellow-400 text-gray-900"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {dzien.nazwa}
                    </button>
                  );
                })}

              </div>
            </div>

            {/* UWAGI */}

            <div className="mt-5">

              <label className="mb-1 block font-semibold text-gray-700">
                Uwagi
              </label>

              <textarea
                value={uwagi}
                onChange={(e) =>
                  setUwagi(e.target.value)
                }
                rows={3}
                placeholder="Np. kod do domofonu..."
                className="w-full rounded-lg border border-gray-300 p-3 text-gray-900"
              />

            </div>

            <div className="mt-5 flex flex-wrap gap-2">

              <button
                type="submit"
                disabled={zapisywanie}
                className="rounded-lg bg-green-600 px-6 py-3 font-bold text-white disabled:opacity-50"
              >
                {zapisywanie
                  ? "Zapisywanie..."
                  : edytowanyId
                  ? "💾 Zapisz zmiany"
                  : "✓ Dodaj abonamentowicza"}
              </button>

              <button
                type="button"
                onClick={zamknijFormularz}
                className="rounded-lg bg-gray-200 px-6 py-3 font-bold text-gray-700"
              >
                Anuluj
              </button>

            </div>

          </form>
        )}

        {/* WYSZUKIWARKA */}

        <div className="mb-6 rounded-xl bg-white p-4 shadow-sm">

          <input
            type="text"
            value={wyszukiwanie}
            onChange={(e) =>
              setWyszukiwanie(e.target.value)
            }
            placeholder="🔎 Szukaj klienta, adresu, telefonu lub kierowcy..."
            className="w-full rounded-lg border border-gray-300 p-3 text-gray-900"
          />

        </div>

        {/* LISTA KLIENTÓW */}

        <div className="space-y-3">

          {przefiltrowaniKlienci.map((klient) => {
            const kierowca = znajdzKierowce(
              klient.kierowcaId
            );

            return (
              <div
                key={klient.id}
                className={`rounded-xl bg-white p-5 shadow-sm ${
                  !klient.aktywny
                    ? "opacity-60"
                    : ""
                }`}
              >

                <div className="flex flex-col justify-between gap-5 md:flex-row">

                  <div className="flex-1">

                    <div className="flex flex-wrap items-center gap-2">

                      <h3 className="text-xl font-bold text-gray-900">
                        {klient.imieNazwisko}
                      </h3>

                      {klient.aktywny ? (
                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                          AKTYWNY
                        </span>
                      ) : (
                        <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-bold text-gray-600">
                          NIEAKTYWNY
                        </span>
                      )}

                    </div>

                    <p className="mt-2 text-gray-600">
                      📍 {klient.adres}
                    </p>

                    {klient.telefon && (
                      <a
                        href={`tel:${klient.telefon.replace(
                          /\s/g,
                          ""
                        )}`}
                        className="mt-1 block text-gray-600"
                      >
                        📞 {klient.telefon}
                      </a>
                    )}

                    <p className="mt-1 text-gray-600">
                      🕐 Dostawa: {klient.godzina}
                    </p>

                    {kierowca ? (
                      <p className="mt-2 font-semibold text-blue-700">
                        🚗 Kierowca: {kierowca.imie}
                      </p>
                    ) : (
                      <p className="mt-2 font-semibold text-orange-600">
                        🚗 Brak przypisanego kierowcy
                      </p>
                    )}

                    {klient.kolejnoscTrasy != null && (
                      <p className="mt-1 font-semibold text-gray-700">
                        🔢 Kolejność na trasie:{" "}
                        {klient.kolejnoscTrasy}
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap gap-1">

                      {klient.dni?.map((dzien) => (
                        <span
                          key={dzien}
                          className="rounded-md bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-800"
                        >
                          {dzien.toUpperCase()}
                        </span>
                      ))}

                    </div>

                    {klient.uwagi && (
                      <p className="mt-3 rounded-lg bg-yellow-50 p-3 text-sm text-gray-700">
                        📝 {klient.uwagi}
                      </p>
                    )}

                  </div>

                  <div className="flex flex-wrap items-end gap-2">

                    <button
                      onClick={() =>
                        rozpocznijEdycje(klient)
                      }
                      className="rounded-lg bg-blue-100 px-4 py-2 font-semibold text-blue-700"
                    >
                      ✏️ Edytuj
                    </button>

                    <button
                      onClick={() =>
                        zmienAktywnosc(
                          klient.id,
                          klient.aktywny
                        )
                      }
                      className="rounded-lg bg-gray-200 px-4 py-2 font-semibold text-gray-700"
                    >
                      {klient.aktywny
                        ? "⏸ Wyłącz"
                        : "▶ Aktywuj"}
                    </button>

                    <button
                      onClick={() =>
                        usunKlienta(klient)
                      }
                      className="rounded-lg bg-red-100 px-4 py-2 font-semibold text-red-700"
                    >
                      🗑 Usuń
                    </button>

                  </div>

                </div>

              </div>
            );
          })}

          {przefiltrowaniKlienci.length === 0 && (
            <div className="rounded-xl bg-white p-10 text-center shadow-sm">

              <p className="text-lg font-bold text-gray-700">
                Brak abonamentowiczów
              </p>

              <p className="mt-1 text-gray-500">
                Nie znaleziono abonamentowiczów.
              </p>

            </div>
          )}

        </div>

      </div>
    </main>
  );
}

function Pole({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div>

      <label className="mb-1 block font-semibold text-gray-700">
        {label}
      </label>

      <input
        type="text"
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 p-3 text-gray-900"
      />

    </div>
  );
}