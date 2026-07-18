"use client";

import Link from "next/link";
import { Home } from "lucide-react";
import { usePathname } from "next/navigation";

export default function HomeButton() {
  const pathname = usePathname();

  // Na stronie głównej nie pokazujemy przycisku
  if (pathname === "/") {
    return null;
  }

  return (
    <Link
      href="/"
      title="Wróć do strony głównej"
      className="
        fixed
        bottom-5
        right-5
        z-[100]
        flex
        h-14
        w-14
        items-center
        justify-center
        rounded-full
        bg-yellow-400
        text-gray-950
        shadow-xl
        transition
        duration-200
        hover:scale-110
        hover:bg-yellow-300
        active:scale-95
      "
    >
      <Home size={25} />
    </Link>
  );
}