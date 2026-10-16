import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "La Puja",
  description: "¿Cuánto vale tu palabra?",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
