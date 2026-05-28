"use client";

import Image from "next/image";

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

    <div className="min-h-screen overflow-hidden select-none cursor-none text-black bg-gradient-to-br from-yellow-200 via-yellow-100 to-amber-200 relative">

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.5),transparent_40%)]"></div>

      <div className="relative z-10 px-8 py-5">

        <div className="flex justify-between items-center mb-6 bg-white/40 backdrop-blur-xl rounded-[30px] border border-yellow-300 shadow-2xl px-8 py-4">

          <div className="flex items-center gap-6">

            <Image
              src="/logo.png"
              alt="Jak u Mamy"
              width={170}
              height={170}
              className="drop-shadow-2xl"
              priority
            />

            <div>

              <p className="uppercase tracking-[0.35em] text-yellow-800 font-bold text-sm mb-2">
                Stołówka
              </p>

              <h1 className="text-5xl font-black leading-none text-yellow-950">
                Jak u Mamy
              </h1>

              <p className="text-lg text-yellow-900 mt-2 font-medium">
                Domowe obiady • Świeże składniki • Ustka
              </p>

            </div>

          </div>

          <div className="text-right">

            <p className="uppercase tracking-[0.25em] text-yellow-800 font-bold text-sm mb-2">
              Aktualna godzina
            </p>

            <div className="text-5xl font-black text-yellow-950">
              {time}
            </div>

            <p className="text-yellow-900 text-lg mt-2 font-semibold">
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
              className="mb-6"
            >

              <div className="flex items-center gap-4 mb-3">

                <div className="h-[2px] w-12 bg-yellow-700 rounded-full"></div>

                <h2 className="text-3xl font-black uppercase tracking-wide text-yellow-900">
                  {category}
                </h2>

              </div>

              <div className="grid grid-cols-1 gap-3">

                {filtered.map(
                  (item: any) => (

                    <div
                      key={item.id}
                      className={`rounded-[24px] border px-6 py-5 flex justify-between items-center transition-all duration-500 shadow-xl backdrop-blur-xl ${
                        item.available
                          ? "bg-white/50 border-yellow-300"
                          : "bg-red-200/60 border-red-500 opacity-70"
                      }`}
                    >

                      <div>

                        <h3
                          className={`text-3xl font-black ${
                            !item.available
                              ? "line-through"
                              : ""
                          }`}
                        >
                          {item.name}
                        </h3>

                        {!item.available && (
                          <div className="mt-2 inline-block bg-red-600 text-white px-4 py-1 rounded-full text-sm font-black animate-pulse shadow-lg">
                            WYPRZEDANE
                          </div>
                        )}

                      </div>

                      <div
                        className={`text-4xl font-black ${
                          item.available
                            ? "text-yellow-800"
                            : "text-red-700"
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