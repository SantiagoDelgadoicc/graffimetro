import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Graffímetro",
  description: "Tu palabra, tu pieza.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
