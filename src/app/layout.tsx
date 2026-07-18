import type { Metadata } from "next";
import "./globals.css";

import AppShell from "@/components/layout/AppShell";
import HomeButton from "@/components/layout/HomeButton";

export const metadata: Metadata = {
  title: "Jak u Mamy",
  description: "System zarządzania Jak u Mamy",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body>
        <AppShell>
          {children}
        </AppShell>

        <HomeButton />
      </body>
    </html>
  );
}