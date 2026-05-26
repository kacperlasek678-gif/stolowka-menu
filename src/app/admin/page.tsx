"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import Cookies from "js-cookie";

import {
  collection,
  addDoc,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export default function AdminPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");

  const [category, setCategory] =
    useState("Zupy");

  const [items, setItems] =
    useState<any[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "menu"),
      (snapshot) => {
        const data =
          snapshot.docs.map(
            (docu) => ({
              id: docu.id,
              ...docu.data(),
            })
          );

        setItems(data);
      }
    );

    return () => unsub();
  }, []);

  const addItem = async () => {
    if (!name || !price) return;

    await addDoc(collection(db, "menu"), {
      name,
      price: Number(price),
      available: true,
      category,
    });

    setName("");
    setPrice("");
  };

  const toggleAvailable =
    async (
      id: string,
      current: boolean
    ) => {
      const refDoc = doc(
        db,
        "menu",
        id
      );

      await updateDoc(refDoc, {
        available: !current,
      });
    };

  const removeItem = async (
    id: string
  ) => {
    const refDoc = doc(
      db,
      "menu",
      id
    );

    await deleteDoc(refDoc);
  };

  return (
    <div className="min-h-screen bg-black text-white p-10">

      <div className="flex items-center justify-between mb-10">

        <h1 className="text-5xl font-bold">
          Panel Admina
        </h1>

        <button
          onClick={() => {
            Cookies.remove(
              "authenticated"
            );

            router.push("/login");
          }}
          className="bg-red-600 px-5 py-3 rounded-xl font-bold"
        >
          Wyloguj
        </button>

      </div>

      <div className="bg-zinc-900 p-8 rounded-3xl shadow-2xl max-w-xl space-y-5 border border-zinc-800 mb-10">

        <input
          type="text"
          placeholder="Nazwa dania"
          value={name}
          onChange={(e) =>
            setName(e.target.value)
          }
          className="w-full bg-zinc-800 border border-zinc-700 p-4 rounded-xl text-white outline-none"
        />

        <input
          type="number"
          placeholder="Cena"
          value={price}
          onChange={(e) =>
            setPrice(e.target.value)
          }
          className="w-full bg-zinc-800 border border-zinc-700 p-4 rounded-xl text-white outline-none"
        />

        <select
          value={category}
          onChange={(e) =>
            setCategory(e.target.value)
          }
          className="w-full bg-zinc-800 border border-zinc-700 p-4 rounded-xl text-white outline-none"
        >
          <option>Zupy</option>
          <option>Dania główne</option>
          <option>Dodatki</option>
          <option>Napoje</option>
          <option>Desery</option>
        </select>

        <button
          onClick={addItem}
          className="bg-white text-black px-6 py-4 rounded-xl w-full font-bold"
        >
          Dodaj danie
        </button>

      </div>

      <div className="space-y-4">

        {items.map((item: any) => (
          <div
            key={item.id}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex items-center justify-between"
          >

            <div>

              <h2
                className={`text-2xl font-bold ${
                  !item.available
                    ? "line-through opacity-40"
                    : ""
                }`}
              >
                {item.name}
              </h2>

              <p className="text-zinc-400 text-lg">
                {item.price} zł
              </p>

              <p className="text-yellow-400 mt-1">
                {item.category}
              </p>

            </div>

            <div className="flex gap-3">

              <button
                onClick={() =>
                  toggleAvailable(
                    item.id,
                    item.available
                  )
                }
                className="bg-yellow-500 text-black px-4 py-2 rounded-xl font-bold"
              >
                {item.available
                  ? "Wyprzedane"
                  : "Przywróć"}
              </button>

              <button
                onClick={() =>
                  removeItem(item.id)
                }
                className="bg-red-600 px-4 py-2 rounded-xl font-bold"
              >
                Usuń
              </button>

            </div>

          </div>
        ))}

      </div>

    </div>
  );
}