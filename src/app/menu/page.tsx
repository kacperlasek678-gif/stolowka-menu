"use client";

import { useEffect, useState } from "react";

import {
  collection,
  onSnapshot,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export default function MenuPage() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "menu"),
      (snapshot) => {
        const data = snapshot.docs.map(
          (doc) => ({
            id: doc.id,
            ...doc.data(),
          })
        );

        setItems(data);
      }
    );

    return () => unsub();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black text-white p-12">

      <div className="max-w-5xl mx-auto">

        <div className="mb-14">
          <h1 className="text-7xl font-black tracking-tight">
            Dzisiejsze Menu
          </h1>

          <p className="text-zinc-400 text-2xl mt-4">
            Smacznego 😋
          </p>
        </div>

        {[
          "Zupy",
          "Dania główne",
          "Dodatki",
          "Napoje",
          "Desery",
        ].map((category) => {

          const filtered = items.filter(
            (item: any) =>
              item.category === category
          );

          if (filtered.length === 0)
            return null;

          return (
            <div
              key={category}
              className="mb-14"
            >

              <h2 className="text-5xl font-black mb-6 text-yellow-400">
                {category}
              </h2>

              <div className="space-y-6">

                {filtered.map((item: any) => (
                  <div
                    key={item.id}
                    className={`rounded-3xl border p-8 flex justify-between items-center transition-all duration-300 ${
                      item.available
                        ? "bg-zinc-900 border-zinc-800"
                        : "bg-zinc-950 border-red-900 opacity-60"
                    }`}
                  >

                    <div>

                      <h2
                        className={`text-4xl font-bold ${
                          !item.available
                            ? "line-through"
                            : ""
                        }`}
                      >
                        {item.name}
                      </h2>

                      {!item.available && (
                        <p className="text-red-500 text-xl mt-2 font-bold">
                          WYPRZEDANE
                        </p>
                      )}

                    </div>

                    <div
                      className={`text-4xl font-black ${
                        item.available
                          ? "text-white"
                          : "text-zinc-500"
                      }`}
                    >
                      {item.price} zł
                    </div>

                  </div>
                ))}

              </div>

            </div>
          );
        })}

      </div>

    </div>
  );
}