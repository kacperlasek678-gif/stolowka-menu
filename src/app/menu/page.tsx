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

      <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]"></div>

      <div className="relative z-10 px-16 py-10">

        <div className="flex justify-between items-center mb-10 bg-white/40 backdrop-blur-xl rounded-[40px] border border-yellow-300 shadow-2xl px-10 py-6">

          <div className="flex items-center gap-10">

            <Image
              src="/logo.png"
              alt="Jak u Mamy"
              width={260}
              height={260}
              className="drop-shadow-2xl"
              priority
            />

            <div>

              <p className="uppercase tracking-[0.4em] text-yellow-800 font-bold text-lg mb-3">
                Stołówka
              </p>

              <h1 className="text-7xl font-black leading-none text-yellow-950">
                Jak u Mamy
              </h1>

              <p className="text-xl text-yellow-900 mt-4 font-medium">
                Domowe obiady • Świeże składniki • Ustka
              </p>

            </div>

          </div>

          <div className="text-right">

            <p className="uppercase tracking-[0.3em] text-yellow-800 font-bold text-lg mb-3">
              Aktualna godzina
            </p>

            <div className="text-6xl font-black text-yellow-950">
              {time}
            </div>

            <p className="text-yellow-900 text-xl mt-3 font-semibold animate-pulse">
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
              className="mb-12"
            >

              <div className="flex items-center gap-5 mb-6">

                <div className="h-[3px] w-20 bg-yellow-700 rounded-full"></div>

                <h2 className="text-4xl font-black uppercase tracking-wide text-yellow-900">
                  {category}
                </h2>

              </div>

              <div className="grid grid-cols-1 gap-5">

                {filtered.map(
                  (item: any) => (

                    <div
                      key={item.id}
                      className={`rounded-[35px] border px-10 py-7 flex justify-between items-center transition-all duration-500 shadow-2xl backdrop-blur-xl ${
                        item.available
                          ? "bg-white/50 border-yellow-300"
                          : "bg-red-200/60 border-red-500 opacity-70"
                      }`}
                    >

                      <div>

                        <h3
                          className={`text-4xl font-black ${
                            !item.available
                              ? "line-through"
                              : ""
                          }`}
                        >
                          {item.name}
                        </h3>

                        {!item.available && (
                          <div className="mt-4 inline-block bg-red-600 text-white px-5 py-2 rounded-full text-xl font-black animate-pulse shadow-lg">
                            WYPRZEDANE
                          </div>
                        )}

                      </div>

                      <div
                        className={`text-5xl font-black ${
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