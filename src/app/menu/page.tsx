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

  useEffect(() => {

    const goFullscreen =
      async () => {

        const elem =
          document.documentElement;

        if (
          !document.fullscreenElement
        ) {

          try {

            await elem.requestFullscreen();

          } catch (err) {

            console.log(err);

          }

        }

      };

    const handleClick = () => {
      goFullscreen();
    };

    window.addEventListener(
      "click",
      handleClick
    );

    return () => {

      window.removeEventListener(
        "click",
        handleClick
      );

    };

  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black text-white p-12 overflow-hidden cursor-none select-none">

      <div className="max-w-7xl mx-auto">

        <div className="flex justify-between items-start mb-14">

          <div>

            <h1 className="text-7xl font-black tracking-tight">
              Jak u Mamy
            </h1>

            <p className="text-zinc-400 text-2xl mt-4">
              Dzisiejsze Menu 🍽️
            </p>

          </div>

          <div className="text-right">

            <p className="text-6xl font-black">
              {time}
            </p>

            <p className="text-zinc-500 text-xl mt-2">
              Smacznego 😋
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

              <h2 className="text-5xl font-black mb-7 text-yellow-400">
                {category}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-7">

                {filtered.map(
                  (item: any) => (

                    <div
                      key={item.id}
                      className={`rounded-3xl border p-8 flex justify-between items-center transition-all duration-500 ${
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
                          <p className="text-red-500 text-xl mt-3 font-bold animate-pulse">
                            WYPRZEDANE
                          </p>
                        )}

                      </div>

                      <div
                        className={`text-5xl font-black ${
                          item.available
                            ? "text-white"
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