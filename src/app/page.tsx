import Link from "next/link";
import {
  UtensilsCrossed,
  PencilLine,
  Truck,
  Car,
  ArrowRight,
} from "lucide-react";

const kafelki = [
  {
    title: "Menu",
    description:
      "Wyświetl aktualne menu stołówki Jak u Mamy.",
    href: "/menu",
    icon: UtensilsCrossed,
    label: "Wyświetl menu",
  },
  {
    title: "Edycja menu",
    description:
      "Zarządzaj daniami, zdjęciami i aktualnym menu.",
    href: "/admin",
    icon: PencilLine,
    label: "Zarządzaj menu",
  },
  {
    title: "Dostawy",
    description:
      "Zarządzaj abonamentowiczami, kierowcami i planowaniem tras.",
    href: "/dostawy",
    icon: Truck,
    label: "Zarządzaj dostawami",
  },
  {
    title: "Panel kierowcy",
    description:
      "Sprawdź swoją trasę, adresy dostaw i status realizacji.",
    href: "/kierowca",
    icon: Car,
    label: "Otwórz panel",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-950">
      {/* TŁO */}

      <div className="relative min-h-screen overflow-hidden">
        {/* DEKORACYJNE TŁO */}

        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-yellow-400/10 blur-3xl" />

        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-yellow-400/10 blur-3xl" />

        {/* ZAWARTOŚĆ */}

        <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-5 py-12 sm:px-8 lg:px-10">
          {/* NAGŁÓWEK */}

          <div className="mb-10 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-400 shadow-lg shadow-yellow-400/20">
              <UtensilsCrossed
                size={32}
                className="text-gray-950"
              />
            </div>

            <p className="text-sm font-bold uppercase tracking-[0.25em] text-yellow-400">
              Stołówka szkolna
            </p>

            <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">
              Jak u Mamy
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-gray-400 sm:text-lg">
              Wybierz dział, do którego chcesz przejść.
            </p>
          </div>

          {/* KAFELKI */}

          <div className="mx-auto grid w-full max-w-5xl gap-5 md:grid-cols-2">
            {kafelki.map((kafelek) => {
              const Icon = kafelek.icon;

              return (
                <Link
                  key={kafelek.href}
                  href={kafelek.href}
                  className="group relative overflow-hidden rounded-3xl border border-gray-800 bg-gray-900 p-6 transition duration-300 hover:-translate-y-1 hover:border-yellow-400/50 hover:shadow-2xl hover:shadow-yellow-400/10 sm:p-8"
                >
                  {/* DELIKATNY EFEKT */}

                  <div className="absolute right-0 top-0 h-32 w-32 translate-x-12 -translate-y-12 rounded-full bg-yellow-400/5 transition duration-300 group-hover:bg-yellow-400/10" />

                  <div className="relative">
                    {/* IKONA */}

                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-400 text-gray-950 transition duration-300 group-hover:scale-110">
                      <Icon size={27} />
                    </div>

                    {/* TYTUŁ */}

                    <h2 className="mt-6 text-2xl font-bold text-white">
                      {kafelek.title}
                    </h2>

                    {/* OPIS */}

                    <p className="mt-2 min-h-12 text-sm leading-relaxed text-gray-400 sm:text-base">
                      {kafelek.description}
                    </p>

                    {/* LINK */}

                    <div className="mt-6 flex items-center gap-2 font-bold text-yellow-400">
                      <span>{kafelek.label}</span>

                      <ArrowRight
                        size={19}
                        className="transition-transform duration-300 group-hover:translate-x-1"
                      />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* STOPKA */}

          <p className="mt-10 text-center text-sm text-gray-600">
            Jak u Mamy • System zarządzania
          </p>
        </div>
      </div>
    </main>
  );
}