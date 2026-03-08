import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Сімейний Архів — Зберігаємо спогади назавжди",
  description:
    "Веб-додаток для зберігання та перегляду оцифрованих сімейних фотографій та відео. Зберігаємо спогади для майбутніх поколінь.",
  keywords: ["сімейний архів", "фото", "спогади", "родина", "альбом"],
  icons: {
    icon: "/ico.png",
    shortcut: "/ico.png",
    apple: "/ico.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk">
      <body
        className={`${playfair.variable} ${inter.variable} font-sans antialiased`}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
