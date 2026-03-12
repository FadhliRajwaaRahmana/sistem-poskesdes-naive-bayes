import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { hasAdminRole } from "@/lib/session-guards";
import { getSession } from "@/lib/session";
import { ActivitySquare, ShieldCheck } from "lucide-react";

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
    <main className="flex min-h-screen">
      {/* Left Decoration Panel (Brand) */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/30 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px]"></div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-white text-slate-900 shadow-xl">
            <ActivitySquare className="size-6" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">POSKESDES</span>
        </div>

        <div className="relative z-10 space-y-6 max-w-lg">
          <h1 className="text-4xl font-extrabold text-white leading-tight">
            Sistem Pakar Klasifikasi Penyakit
          </h1>
          <p className="text-lg text-slate-300 leading-relaxed">
            Platform pintar berbasis <span className="font-semibold text-white">Naive Bayes</span> untuk membantu tenaga medis mendiagnosa pasien dengan cepat dan presisi.
          </p>
        </div>

        <div className="relative z-10 text-slate-400 text-sm">
          &copy; {new Date().getFullYear()} POSKESDES Admin System.
        </div>
      </div>

      {/* Right Login Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 bg-slate-50">
        <div className="w-full max-w-md animate-slide-up">
          {/* Mobile Only Header */}
          <div className="lg:hidden flex justify-center mb-10">
            <div className="flex flex-col items-center gap-4">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-xl shadow-slate-900/20">
                <ActivitySquare className="size-7" />
              </div>
              <div className="text-center">
                <h1 className="text-2xl font-bold text-slate-900">POSKESDES</h1>
                <p className="text-sm font-medium text-slate-500">Sistem Pakar Diagnosa</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-[var(--shadow-card)] border border-slate-100">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Sign In</h2>
              <p className="text-sm text-slate-500 mt-2 font-medium">Gunakan kredensial admin untuk masuk.</p>
            </div>

            {errorMessage ? (
              <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3.5 text-sm font-semibold text-rose-700 flex items-center gap-3">
                <ShieldCheck className="size-5 shrink-0 text-rose-500" />
                <p>{errorMessage}</p>
              </div>
            ) : null}

            <div className="mt-8">
              <LoginForm />
            </div>
          </div>

          <div className="lg:hidden mt-8 text-center text-sm font-medium text-slate-400">
            &copy; {new Date().getFullYear()} POSKESDES
          </div>
        </div>
      </div>
    </main>
  );
}