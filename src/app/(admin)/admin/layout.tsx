import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import "../../globals.css";

const inter = Inter({
  subsets: ["latin", "latin-ext", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin", "latin-ext", "cyrillic"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Admin | INAUTO.MD",
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ro" className={`${inter.variable} ${manrope.variable}`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
