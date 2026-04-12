import type { Metadata } from "next";
import { Unbounded, Montserrat } from "next/font/google";
import "./globals.css";

const unbounded = Unbounded({
  subsets: ["latin", "cyrillic"],
  variable: "--font-unbounded",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin", "cyrillic"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SERVEX",
  description: "Платформа управления сервисным бизнесом",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body
        className={`${unbounded.variable} ${montserrat.variable} font-montserrat bg-[#0A0D14] text-[#EDF2FA] antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
