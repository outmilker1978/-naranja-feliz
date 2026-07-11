import type { Metadata } from "next";
import "./globals.css";
import SiteHeader from "@/components/site-header";
import Footer from "@/components/footer";
import ToolsPanelWrapper from "@/components/tools-panel-wrapper";

export const metadata: Metadata = {
  title: "Naranja Feliz — Motivación en cada gajo",
  description: "Школа испанского языка. Учись с мотивацией.",
  icons: {
    icon: "/logo-128.png",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="h-full antialiased">
      <body className="min-h-full bg-surface text-zinc-900">
        <div className="sticky top-0 z-50">
          <SiteHeader />
        </div>
        {children}
        <Footer />
        <ToolsPanelWrapper />
      </body>
    </html>
  );
}
