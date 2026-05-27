"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  collection,
  onSnapshot,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export default function MenuPage() {

  const [items, setItems] =
    useState<any[]>([]);

  const [time, setTime] =
    useState("");

  useEffect(() => {

    const unsub = onSnapshot(
      collection(db, "menu"),
      (snapshot) => {

        const data =
          snapshot.docs.map(
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

  useEffect(() => {

    const interval =
      setInterval(() => {

        const now =
          new Date();

        setTime(
          now.toLocaleTimeString(
            "pl-PL",
            {
              hour: "2-digit",
              minute: "2-digit",
            }
          )
        );

      }, 1000);

    return () =>
      clearInterval(interval);

  }, []);

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white overflow-hidden select-none">

      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top,rgba(255,215,0,0.25),transparent_40%)]"></div>

      <div className="relative z-10 px-16 py-12">

        <div className="flex justify-between items-start mb-16 border-b border-yellow-700 pb-8">

          <div>

            <p className="text-yellow-500 text-xl tracking-[0.4em] uppercase mb-3">
              Stołówka
            </p>

            <h1 className="text-8xl font-black leading-none">
              Jak u Mamy
            </h1>

            <p className="text-zinc-400 text-2xl mt-6">
              Domowe obiady • Świeże składniki • Ustka
            </p>

          </div>

          <div className="text-right">

            <p className="text-yellow-500 text-lg uppercase tracking-[0.3em] mb-3">
              Aktualna godzina
            </p>

            <div className="text-7xl font-black">
              {time}
            </div>

            <p className="text-zinc-500 text-2xl mt-4">
              Smacznego 🍽️
            </p>

          </div>

        </div>

        {[
          "Zupy",
          "Dania główne",
          "Dodatki",
          "Napoje",
          "Desery",
        ].map((category) => {

          const filtered =
            items.filter(
              (item: any) =>
                item.category ===
                category
            );

          if (
            filtered.length === 0
          ) {
            return null;
          }

          return (

            <div
              key={category}
              className="mb-16"
            >

              <div className="flex items-center gap-5 mb-8">

                <div className="h-[2px] w-20 bg-yellow-500"></div>

                <h2 className="text-5xl font-black text-yellow-500 uppercase tracking-wide">
                  {category}
                </h2>

              </div>

              <div className="grid grid-cols-1 gap-6">

                {filtered.map(
                  (item: any) => (

                    <div
                      key={item.id}
                      className={`rounded-[32px] border backdrop-blur-md px-10 py-8 flex justify-between items-center transition-all duration-500 shadow-2xl ${
                        item.available
                          ? "bg-zinc-900/90 border-zinc-800"
                          : "bg-red-950/40 border-red-800 opacity-70"
                      }`}
                    >

                      <div>

                        <h3
                          className={`text-5xl font-bold ${
                            !item.available
                              ? "line-through"
                              : ""
                          }`}
                        >
                          {item.name}
                        </h3>

                        {!item.available && (
                          <div className="mt-4 inline-block bg-red-600 px-5 py-2 rounded-full text-xl font-black animate-pulse">
                            WYPRZEDANE
                          </div>
                        )}

                      </div>

                      <div
                        className={`text-6xl font-black ${
                          item.available
                            ? "text-yellow-400"
                            : "text-zinc-500"
                        }`}
                      >
                        {item.price} zł
                      </div>

                    </div>

                  )
                )}

              </div>

            </div>

          );

        })}

      </div>

    </div>
  );
}