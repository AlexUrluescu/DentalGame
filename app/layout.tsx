import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DentalQuiz - Odontoterapie",
  description: "Quiz interactiv pentru studenți la medicină dentară - Capitolul 1 Odontoterapie: Țesuturile dure dentare",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ro">
      <body>{children}</body>
    </html>
  );
}
