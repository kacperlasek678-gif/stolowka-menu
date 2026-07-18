"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

import AdminGuard from "@/components/auth/AdminGuard";
import AdminLogoutButton from "@/components/auth/AdminLogoutButton";
import { apiFetch } from "@/lib/api/fetcher";

type MenuItem = {
  id: string;
  name: string;
  price: number;
  category: string;
  available: boolean;
};

type MenuPayload = Omit<MenuItem, "id">;

const CATEGORIES = ["Zupy", "Dania główne", "Dodatki", "Napoje", "Desery"];

export default function AdminPage() {
  return (
    <AdminGuard>
      <MenuAdmin />
    </AdminGuard>
  );
}

function MenuAdmin() {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadItems = useCallback(async () => {
    try {
      const data = await apiFetch<{ success: true; items: MenuItem[] }>("/api/admin/menu");
      setItems(data.items);
    } catch (caughtError) {
      console.error("Błąd pobierania menu:", caughtError);
      setError("Nie udało się pobrać menu.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadItems);
  }, [loadItems]);

  async function addItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = Number(price);

    if (!name.trim() || !Number.isFinite(value) || value < 0) {
      setError("Podaj nazwę i prawidłową cenę dania.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      await apiFetch("/api/admin/menu", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          price: value,
          category,
          available: true,
        } satisfies MenuPayload),
      });
      setName("");
      setPrice("");
      await loadItems();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Nie udało się dodać dania.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleAvailable(item: MenuItem) {
    try {
      setError("");
      await apiFetch("/api/admin/menu", {
        method: "PATCH",
        body: JSON.stringify({ ...item, available: !item.available }),
      });
      await loadItems();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Nie udało się zaktualizować dania.");
    }
  }

  async function removeItem(item: MenuItem) {
    if (!window.confirm(`Usunąć danie „${item.name}”?`)) return;

    try {
      setError("");
      await apiFetch("/api/admin/menu", {
        method: "DELETE",
        body: JSON.stringify({ id: item.id }),
      });
      await loadItems();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Nie udało się usunąć dania.");
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 p-5 text-white sm:p-10">
      <div className="mx-auto max-w-4xl">
        <header className="mb-10 flex items-center justify-between gap-5">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-yellow-400">Jak u Mamy</p>
            <h1 className="mt-2 text-3xl font-black sm:text-5xl">Edycja menu</h1>
          </div>
          <div className="w-40"><AdminLogoutButton /></div>
        </header>

        <form onSubmit={addItem} className="mb-10 grid gap-4 rounded-3xl border border-zinc-800 bg-zinc-900 p-6 sm:grid-cols-2">
          <input
            type="text"
            placeholder="Nazwa dania"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={120}
            required
            className="rounded-xl border border-zinc-700 bg-zinc-800 p-4 outline-none focus:border-yellow-400"
          />
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="Cena"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            required
            className="rounded-xl border border-zinc-700 bg-zinc-800 p-4 outline-none focus:border-yellow-400"
          />
          <select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-xl border border-zinc-700 bg-zinc-800 p-4 outline-none focus:border-yellow-400">
            {CATEGORIES.map((value) => <option key={value}>{value}</option>)}
          </select>
          <button type="submit" disabled={saving} className="rounded-xl bg-yellow-400 p-4 font-black text-gray-950 transition hover:bg-yellow-300 disabled:opacity-50">
            {saving ? "Zapisywanie..." : "Dodaj danie"}
          </button>
        </form>

        {error && <p role="alert" className="mb-5 rounded-xl bg-red-950 p-4 font-semibold text-red-200">{error}</p>}

        {loading ? (
          <p className="text-zinc-400">Ładowanie menu...</p>
        ) : items.length === 0 ? (
          <p className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-zinc-400">Brak dań w menu.</p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <article key={item.id} className="flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className={item.available ? "text-xl font-bold" : "text-xl font-bold text-zinc-500 line-through"}>{item.name}</h2>
                  <p className="mt-1 text-zinc-400">{item.category} · {item.price.toFixed(2)} zł</p>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => void toggleAvailable(item)} className="rounded-xl bg-yellow-400 px-4 py-3 font-bold text-gray-950">
                    {item.available ? "Wyprzedane" : "Przywróć"}
                  </button>
                  <button type="button" onClick={() => void removeItem(item)} className="rounded-xl bg-red-700 px-4 py-3 font-bold">
                    Usuń
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
