import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Potenza TI — Inventário",
  description: "Sistema de Gerenciamento de Inventário de TI",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
