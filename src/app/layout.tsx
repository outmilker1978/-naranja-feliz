import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SiteHeader from "@/components/site-header";
import Footer from "@/components/footer";
import ToolsPanelWrapper from "@/components/tools-panel-wrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Naranja Feliz — Motivación en cada gajo",
  description: "Школа испанского языка. Учись с мотивацией.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-surface text-zinc-900">
        <SiteHeader />
        {children}
        <Footer />
        <ToolsPanelWrapper />
      </body>
    </html>
  );
}
