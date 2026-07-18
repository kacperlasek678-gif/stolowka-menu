import type {
  ReactNode,
} from "react";

import AdminGuard from "@/components/auth/AdminGuard";

/* =========================================================
   LAYOUT PANELU DOSTAW

   Wszystkie strony znajdujące się pod:

   /dostawy
   /dostawy/kierowcy
   /dostawy/...

   będą wymagały zalogowania administratora.
========================================================= */

export default function DostawyLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <AdminGuard>
      {children}
    </AdminGuard>
  );
}