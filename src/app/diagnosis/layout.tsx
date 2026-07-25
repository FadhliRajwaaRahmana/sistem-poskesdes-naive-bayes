import type { ReactNode } from "react";
import { ActivitySquare, LogIn } from "lucide-react";
import Link from "next/link";

export default function DiagnosisLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="sticky top-0 z-40 border-b border-slate-200/50 bg-white/80 backdrop-blur-md shadow-sm print:hidden">
        <div className="mx-auto max-w-[1400px] flex items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-teal-500 text-white shadow-lg shadow-primary/20">
              <ActivitySquare className="size-5" />
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight text-slate-900">
                POSYANDU
              </h1>
              <p className="text-[10px] text-teal-600 font-bold tracking-widest uppercase">
                Sistem Diagnosis Gizi
              </p>
            </div>
          </div>
          <Link
            href="/login"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 hover:border-primary hover:text-primary transition-all active:scale-95"
          >
            <LogIn className="size-4" />
            Login Admin
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 xl:py-8 print:max-w-none print:px-0 print:py-0">
        {children}
      </main>
    </div>
  );
}
