import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "Synthetic Souls — Consensus Ghosts",
  description: "Ficciones que se vuelven sintéticamente reales cuando un consenso descentralizado de AI acuerda quién es.",
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='30' fill='%23d4a574' opacity='0.3'/%3E%3Ccircle cx='50' cy='50' r='15' fill='%23d4a574'/%3E%3C/svg%3E",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="noise-overlay antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
