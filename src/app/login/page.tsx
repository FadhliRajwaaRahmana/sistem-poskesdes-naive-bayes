import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { hasAdminRole } from "@/lib/session-guards";
import { getSession } from "@/lib/session";
import { ActivitySquare, ShieldCheck, Stethoscope } from "lucide-react";

type PageSearchParams = Record<string, string | string[] | undefined>;

type LoginPageProps = {
  searchParams?: Promise<PageSearchParams>;
};

function getSearchValue(value: string | string[] | undefined) {
  return typeof value === "string" ? value : null;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getSession();
  const params = searchParams ? await searchParams : {};
  const errorMessage = getSearchValue(params.error);

  if (session?.user && hasAdminRole(session.user.role)) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen bg-slate-50 font-sans">
      {/* Left Decoration Panel (Brand) */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 flex-col justify-between p-12 relative overflow-hidden">
        {/* Soft abstract gradients */}
        <div className="absolute inset-0 opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-teal-500/20 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/10 rounded-full blur-[150px]"></div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-teal-500 text-white shadow-xl shadow-teal-900/50">
            <ActivitySquare className="size-6" />
          </div>
          <span className="text-2xl font-extrabold tracking-tight text-white">POSKESDES</span>
        </div>

        <div className="relative z-10 space-y-8 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-teal-300 text-sm font-semibold backdrop-blur-md">
            <Stethoscope className="size-4" />
            <span>Sistem Pakar Naive Bayes</span>
          </div>
          <h1 className="text-5xl font-black text-white leading-[1.15]">
            Diagnosa Pasien Lebih Cepat & Presisi.
          </h1>
          <p className="text-lg text-slate-300 leading-relaxed font-medium">
            Platform cerdas untuk membantu tenaga medis di Pos Kesehatan Desa dalam melakukan klasifikasi dan diagnosa penyakit secara efisien.
          </p>
        </div>

        <div className="relative z-10 text-slate-400 text-sm font-medium">
          &copy; {new Date().getFullYear()} POSKESDES Admin System. All rights reserved.
        </div>
      </div>

      {/* Right Login Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
        <div className="w-full max-w-md">
          {/* Mobile Only Header */}
          <div className="lg:hidden flex justify-center mb-10">
            <div className="flex flex-col items-center gap-4">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-teal-500 text-white shadow-xl shadow-primary/30">
                <ActivitySquare className="size-8" />
              </div>
              <div className="text-center">
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">POSKESDES</h1>
                <p className="text-sm font-bold text-teal-600 uppercase tracking-widest mt-1">Sistem Diagnosa</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
            <div>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Selamat Datang</h2>
              <p className="text-slate-500 mt-2 font-medium text-base">Silakan masuk menggunakan kredensial admin Anda.</p>
            </div>

            {errorMessage ? (
              <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3.5 text-sm font-bold text-rose-700 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                <ShieldCheck className="size-5 shrink-0 text-rose-500" />
                <p>{errorMessage}</p>
              </div>
            ) : null}

            <div className="mt-8">
              <LoginForm />
            </div>
          </div>

          <div className="lg:hidden mt-10 text-center text-sm font-medium text-slate-400">
            &copy; {new Date().getFullYear()} POSKESDES System
          </div>
        </div>
      </div>
    </main>
  );
}
