"use client";

import { Menu } from "lucide-react";

type HeaderProps = {
  onMenuClick: () => void;
};

function formatujDate() {
  return new Intl.DateTimeFormat("pl-PL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

export default function Header({
  onMenuClick,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur">

      <div className="flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">

        <div className="flex items-center gap-4">

          <button
            type="button"
            onClick={onMenuClick}
            className="rounded-xl border border-gray-200 p-2.5 text-gray-700 hover:bg-gray-100 lg:hidden"
          >
            <Menu size={22} />
          </button>

          <div>
            <p className="font-bold text-gray-900">
              Dzień dobry 👋
            </p>

            <p className="mt-0.5 text-sm capitalize text-gray-500">
              {formatujDate()}
            </p>
          </div>

        </div>

        <div className="hidden items-center gap-3 sm:flex">

          <div className="text-right">
            <p className="text-sm font-bold text-gray-900">
              Jak u Mamy
            </p>

            <p className="text-xs text-gray-500">
              Panel dostaw
            </p>
          </div>

          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-yellow-400 font-bold text-gray-900">
            JM
          </div>

        </div>

      </div>

    </header>
  );
}