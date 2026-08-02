import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PetCare | El bienestar empieza aquí",
  description: "Encuentra y agenda los mejores servicios para tu mascota.",
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
