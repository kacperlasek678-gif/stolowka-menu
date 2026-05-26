"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

export default function LoginPage() {

  const router = useRouter();

  const [login, setLogin] =
    useState("");

  const [password, setPassword] =
    useState("");

  const handleLogin = () => {

    const correctLogin =
      process.env
        .NEXT_PUBLIC_ADMIN_LOGIN;

    const correctPassword =
      process.env
        .NEXT_PUBLIC_ADMIN_PASSWORD;

    if (
      login === correctLogin &&
      password === correctPassword
    ) {

      Cookies.set(
        "authenticated",
        "true"
      );

      router.push("/admin");

    } else {

      alert(
        "Nieprawidłowy login lub hasło"
      );

    }

  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-10 w-full max-w-md">

        <h1 className="text-5xl text-white font-black mb-8 text-center">
          Logowanie
        </h1>

        <div className="space-y-5">

          <input
            type="text"
            placeholder="Login"
            value={login}
            onChange={(e) =>
              setLogin(
                e.target.value
              )
            }
            className="w-full bg-zinc-800 border border-zinc-700 p-4 rounded-xl text-white outline-none"
          />

          <input
            type="password"
            placeholder="Hasło"
            value={password}
            onChange={(e) =>
              setPassword(
                e.target.value
              )
            }
            className="w-full bg-zinc-800 border border-zinc-700 p-4 rounded-xl text-white outline-none"
          />

          <button
            onClick={handleLogin}
            className="w-full bg-white text-black py-4 rounded-xl font-bold"
          >
            Zaloguj
          </button>

        </div>

      </div>

    </div>
  );
}