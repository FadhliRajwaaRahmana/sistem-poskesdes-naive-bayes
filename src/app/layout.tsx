import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const fontSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "Sistem Diagnosis POSYANDU";
const appUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  applicationName: appName,
  title: {
    default: appName,
    template: `%s | ${appName}`,
  },
  description: "Sistem pakar diagnosis penyakit gizi buruk pada balita POSYANDU berbasis Naive Bayes.",
  keywords: [
    "POSYANDU",
    "Naive Bayes",
    "diagnosis balita",
    "sistem pakar",
    "kesehatan desa",
  ],
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: appUrl,
    title: appName,
    description: "Platform admin POSYANDU untuk diagnosis gizi balita, pengelolaan dataset, dan simulasi perhitungan Naive Bayes.",
    siteName: appName,
  },
  twitter: {
    card: "summary_large_image",
    title: appName,
    description: "Platform admin POSYANDU untuk diagnosis gizi balita berbasis Naive Bayes.",
  },
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
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            className: "font-sans",
            duration: 4000,
          }}
        />
      </body>
    </html>
  );
}
