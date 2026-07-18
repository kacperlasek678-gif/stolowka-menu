"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Truck,
  Users,
  Car,
  MapPinned,
  Map,
  BarChart3,
  Settings,
  X,
  UtensilsCrossed,
} from "lucide-react";

import { cn } from "@/lib/utils";

type SidebarProps = {
  open: boolean;
  onClose: () => void;
};

const navigation = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Dostawy",
    href: "/dostawy",
    icon: Truck,
  },
  {
    title: "Klienci",
    href: "/dostawy/klienci",
    icon: Users,
  },
  {
    title: "Kierowcy",
    href: "/dostawy/kierowcy",
    icon: Car,
  },
  {
    title: "Planowanie",
    href: "/dostawy/planowanie",
    icon: MapPinned,
  },
  {
    title: "Trasa kierowcy",
    href: "/dostawy/trasa",
    icon: Map,
  },
];

const futureNavigation = [
  {
    title: "Raporty",
    icon: BarChart3,
  },
  {
    title: "Ustawienia",
    icon: Settings,
  },
];

export default function Sidebar({
  open,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* TŁO NA TELEFONIE */}

      {open && (
        <button
          type="button"
          aria-label="Zamknij menu"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      {/* SIDEBAR */}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-gray-950 text-white transition-transform duration-300",
          "lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* LOGO */}

        <div className="flex h-20 items-center justify-between border-b border-white/10 px-6">

          <Link
            href="/dashboard"
            onClick={onClose}
            className="flex items-center gap-3"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-400 text-gray-950">
              <UtensilsCrossed size={23} />
            </div>

            <div>
              <p className="text-lg font-bold">
                Jak u Mamy
              </p>

              <p className="text-xs text-gray-400">
                System dostaw
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X size={22} />
          </button>

        </div>

        {/* MENU */}

        <nav className="flex-1 overflow-y-auto px-4 py-6">

          <p className="mb-3 px-3 text-xs font-bold uppercase tracking-wider text-gray-500">
            Zarządzanie
          </p>

          <div className="space-y-1">

            {navigation.map((item) => {
              const Icon = item.icon;

              const active =
                pathname === item.href ||
                (item.href !== "/dostawy" &&
                  pathname.startsWith(
                    `${item.href}/`
                  ));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition",
                    active
                      ? "bg-yellow-400 text-gray-950"
                      : "text-gray-300 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <Icon size={20} />

                  {item.title}
                </Link>
              );
            })}

          </div>

          <p className="mb-3 mt-8 px-3 text-xs font-bold uppercase tracking-wider text-gray-500">
            Pozostałe
          </p>

          <div className="space-y-1">

            {futureNavigation.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-gray-600"
                  title="Moduł będzie dostępny wkrótce"
                >
                  <Icon size={20} />

                  {item.title}

                  <span className="ml-auto rounded-full bg-white/5 px-2 py-1 text-[10px]">
                    Wkrótce
                  </span>
                </div>
              );
            })}

          </div>

        </nav>

        {/* STOPKA */}

        <div className="border-t border-white/10 p-4">

          <div className="rounded-xl bg-white/5 p-3">

            <p className="font-semibold text-white">
              Panel administracyjny
            </p>

            <p className="mt-1 text-xs text-gray-400">
              Stołówka Jak u Mamy
            </p>

          </div>

        </div>

      </aside>
    </>
  );
}