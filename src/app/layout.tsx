import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const fontSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sistem Diagnosa POSKESDES",
  description: "Sistem klasifikasi penyakit pasien POSKESDES berbasis Naive Bayes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="scroll-smooth">
      <body className={`${fontSans.variable} font-sans antialiased text-slate-800 bg-slate-50 min-h-screen selection:bg-teal-500/30 selection:text-teal-900`}>
        {children}
      </body>
    </html>
  );
}
