"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Home,
  LayoutDashboard,
  Map,
  MapPinned,
  Truck,
  Users,
  UserRound,
} from "lucide-react";

import AdminLogoutButton from "@/components/auth/AdminLogoutButton";

/* =========================================================
   APP SHELL
========================================================= */

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  /* =======================================================
     CZY JESTEŚMY W PANELU DOSTAW

     Sidebar pokazujemy tylko dla:
     /dostawy
     /dostawy/...
  ======================================================= */

  const czyPanelDostaw =
    pathname === "/dostawy" ||
    pathname.startsWith("/dostawy/");

  /* =======================================================
     POZA PANELEM DOSTAW

     Bez sidebara:
     /
     /menu
     /kierowca
     itd.
  ======================================================= */

  if (!czyPanelDostaw) {
    return <>{children}</>;
  }

  /* =======================================================
     SPRAWDZENIE AKTYWNEGO LINKU
  ======================================================= */

  function czyAktywny(href: string) {
    /*
      Główna strona dostaw ma być aktywna
      tylko dokładnie pod /dostawy.
    */

    if (href === "/dostawy") {
      return pathname === "/dostawy";
    }

    /*
      Pozostałe sekcje są aktywne również
      dla swoich podstron.
    */

    return (
      pathname === href ||
      pathname.startsWith(`${href}/`)
    );
  }

  /* =======================================================
     WSPÓLNA KLASA LINKU
  ======================================================= */

  function klasaLinku(href: string) {
    const aktywny =
      czyAktywny(href);

    return `
      flex
      items-center
      gap-3
      rounded-xl
      px-4
      py-3
      font-bold
      transition
      ${
        aktywny
          ? "bg-yellow-400 text-gray-950 shadow-sm"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-950"
      }
    `;
  }

  /* =======================================================
     PANEL DOSTAW
  ======================================================= */

  return (
    <div className="min-h-screen bg-gray-100">

      {/* ===================================================
          SIDEBAR
      =================================================== */}

      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-gray-200 bg-white shadow-sm md:flex">

        {/* ===============================================
            LOGO / NAGŁÓWEK
        =============================================== */}

        <div className="border-b border-gray-100 px-5 py-5">

          <p className="text-sm font-black uppercase tracking-wider text-yellow-600">
            Jak u Mamy
          </p>

          <h1 className="mt-1 text-xl font-black text-gray-950">
            Panel dostaw
          </h1>

        </div>

        {/* ===============================================
            NAWIGACJA
        =============================================== */}

        <nav className="flex-1 overflow-y-auto p-4">

          <div className="space-y-2">

            {/* ===========================================
                STRONA GŁÓWNA CAŁEGO SYSTEMU
            =========================================== */}

            <Link
              href="/"
              className="
                flex
                items-center
                gap-3
                rounded-xl
                px-4
                py-3
                font-bold
                text-gray-600
                transition
                hover:bg-gray-100
                hover:text-gray-950
              "
            >
              <Home size={20} />

              <span>
                Strona główna
              </span>
            </Link>

            {/* ===========================================
                SEPARATOR
            =========================================== */}

            <div className="my-3 border-t border-gray-100" />

            {/* ===========================================
                DOSTAWY
            =========================================== */}

            <Link
              href="/dostawy"
              className={klasaLinku(
                "/dostawy"
              )}
            >
              <LayoutDashboard
                size={20}
              />

              <span>
                Dostawy
              </span>
            </Link>

            {/* ===========================================
                PLANOWANIE
            =========================================== */}

            <Link
              href="/dostawy/planowanie"
              className={klasaLinku(
                "/dostawy/planowanie"
              )}
            >
              <MapPinned
                size={20}
              />

              <span>
                Planowanie
              </span>
            </Link>

            {/* ===========================================
                KLIENCI / ABONAMENTOWICZE
            =========================================== */}

            <Link
              href="/dostawy/klienci"
              className={klasaLinku(
                "/dostawy/klienci"
              )}
            >
              <Users
                size={20}
              />

              <span>
                Abonamentowicze
              </span>
            </Link>

            {/* ===========================================
                TRASY
            =========================================== */}

            <Link
              href="/dostawy/trasa"
              className={klasaLinku(
                "/dostawy/trasa"
              )}
            >
              <Map
                size={20}
              />

              <span>
                Trasy
              </span>
            </Link>

            {/* ===========================================
                KIEROWCY
            =========================================== */}

            <Link
              href="/dostawy/kierowcy"
              className={klasaLinku(
                "/dostawy/kierowcy"
              )}
            >
              <UserRound
                size={20}
              />

              <span>
                Kierowcy
              </span>
            </Link>

            {/* ===========================================
                SEPARATOR
            =========================================== */}

            <div className="my-3 border-t border-gray-100" />

            {/* ===========================================
                PANEL KIEROWCY

                To osobny panel, dlatego nie korzystamy
                z podświetlenia sekcji administratora.
            =========================================== */}

            <Link
              href="/kierowca"
              className="
                flex
                items-center
                gap-3
                rounded-xl
                px-4
                py-3
                font-bold
                text-gray-600
                transition
                hover:bg-gray-100
                hover:text-gray-950
              "
            >
              <Truck
                size={20}
              />

              <span>
                Panel kierowcy
              </span>
            </Link>

          </div>

        </nav>

        {/* ===============================================
            WYLOGOWANIE ADMINISTRATORA
        =============================================== */}

        <div className="mt-auto border-t border-gray-100 bg-white p-4">

          <AdminLogoutButton />

        </div>

      </aside>

      {/* ===================================================
          GŁÓWNA TREŚĆ

          Sidebar ma szerokość 256 px = w-64.
          Dlatego od breakpointu md przesuwamy treść.
      =================================================== */}

      <main className="min-h-screen md:pl-64">

        {children}

      </main>

      {/* ===================================================
          NAWIGACJA MOBILNA

          Widoczna poniżej 768 px.
      =================================================== */}

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white shadow-lg md:hidden">

        <div className="overflow-x-auto">

          <div className="flex min-w-max items-center gap-1 p-2">

            {/* ===========================================
                START
            =========================================== */}

            <Link
              href="/"
              className="
                flex
                min-w-20
                flex-col
                items-center
                gap-1
                rounded-xl
                px-3
                py-2
                text-xs
                font-bold
                text-gray-500
              "
            >
              <Home size={20} />

              <span>
                Start
              </span>
            </Link>

            {/* ===========================================
                DOSTAWY
            =========================================== */}

            <Link
              href="/dostawy"
              className={`
                flex
                min-w-20
                flex-col
                items-center
                gap-1
                rounded-xl
                px-3
                py-2
                text-xs
                font-bold
                ${
                  czyAktywny(
                    "/dostawy"
                  )
                    ? "bg-yellow-100 text-gray-950"
                    : "text-gray-500"
                }
              `}
            >
              <LayoutDashboard
                size={20}
              />

              <span>
                Dostawy
              </span>
            </Link>

            {/* ===========================================
                PLANOWANIE
            =========================================== */}

            <Link
              href="/dostawy/planowanie"
              className={`
                flex
                min-w-20
                flex-col
                items-center
                gap-1
                rounded-xl
                px-3
                py-2
                text-xs
                font-bold
                ${
                  czyAktywny(
                    "/dostawy/planowanie"
                  )
                    ? "bg-yellow-100 text-gray-950"
                    : "text-gray-500"
                }
              `}
            >
              <MapPinned
                size={20}
              />

              <span>
                Plan
              </span>
            </Link>

            {/* ===========================================
                ABONAMENTOWICZE
            =========================================== */}

            <Link
              href="/dostawy/klienci"
              className={`
                flex
                min-w-20
                flex-col
                items-center
                gap-1
                rounded-xl
                px-3
                py-2
                text-xs
                font-bold
                ${
                  czyAktywny(
                    "/dostawy/klienci"
                  )
                    ? "bg-yellow-100 text-gray-950"
                    : "text-gray-500"
                }
              `}
            >
              <Users
                size={20}
              />

              <span>
                Klienci
              </span>
            </Link>

            {/* ===========================================
                TRASY
            =========================================== */}

            <Link
              href="/dostawy/trasa"
              className={`
                flex
                min-w-20
                flex-col
                items-center
                gap-1
                rounded-xl
                px-3
                py-2
                text-xs
                font-bold
                ${
                  czyAktywny(
                    "/dostawy/trasa"
                  )
                    ? "bg-yellow-100 text-gray-950"
                    : "text-gray-500"
                }
              `}
            >
              <Map
                size={20}
              />

              <span>
                Trasy
              </span>
            </Link>

            {/* ===========================================
                KIEROWCY
            =========================================== */}

            <Link
              href="/dostawy/kierowcy"
              className={`
                flex
                min-w-20
                flex-col
                items-center
                gap-1
                rounded-xl
                px-3
                py-2
                text-xs
                font-bold
                ${
                  czyAktywny(
                    "/dostawy/kierowcy"
                  )
                    ? "bg-yellow-100 text-gray-950"
                    : "text-gray-500"
                }
              `}
            >
              <UserRound
                size={20}
              />

              <span>
                Kierowcy
              </span>
            </Link>

            {/* ===========================================
                PANEL KIEROWCY
            =========================================== */}

            <Link
              href="/kierowca"
              className="
                flex
                min-w-20
                flex-col
                items-center
                gap-1
                rounded-xl
                px-3
                py-2
                text-xs
                font-bold
                text-gray-500
              "
            >
              <Truck
                size={20}
              />

              <span>
                Panel
              </span>
            </Link>

          </div>

        </div>

        {/* ===============================================
            WYLOGOWANIE NA TELEFONIE
        =============================================== */}

        <div className="border-t border-gray-100 p-2">

          <AdminLogoutButton />

        </div>

      </nav>

      {/* ===================================================
          MIEJSCE NA NAWIGACJĘ MOBILNĄ

          Dzięki temu pasek nie zasłania treści.
      =================================================== */}

      <div className="h-36 md:hidden" />

    </div>
  );
}