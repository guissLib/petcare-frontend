import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "PetCare | El bienestar empieza aquí",
    template: "%s | PetCare",
  },
  description:
    "Encuentra proveedores, registra tus mascotas y agenda servicios de cuidado.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
