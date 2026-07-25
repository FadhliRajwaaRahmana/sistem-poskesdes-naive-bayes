import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/session";
import {
  Table2,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export default async function RulePage() {
  await requireAdminSession();

  const [penyakitList, gejalaList, ruleList] = await Promise.all([
    prisma.penyakit.findMany({ orderBy: { kode: "asc" } }),
    prisma.gejala.findMany({ orderBy: { kode: "asc" } }),
    prisma.penyakitGejala.findMany(),
  ]);

  const ruleMap = new Map<string, number>();
  for (const rule of ruleList) {
    ruleMap.set(`${rule.penyakitId}:${rule.gejalaId}`, rule.likelihood);
  }

  return (
    <section className="animate-fade-in space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-4 rounded-[2rem] bg-slate-900 p-8 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-teal-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
        <div className="relative z-10 flex items-center gap-5">
          <div className="rounded-2xl bg-white/10 border border-white/20 p-4 text-white backdrop-blur-md shadow-lg">
            <Table2 className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Data Rule</h2>
            <p className="text-slate-300 mt-2 font-medium max-w-lg leading-relaxed">
              Tabel relasi penyakit dan gejala. Nilai 1 = gejala terkait penyakit, 0 = tidak terkait.
              Digunakan dalam perhitungan Naive Bayes (Laplacian Smoothing).
            </p>
          </div>
        </div>
      </div>

      <div className="card-container !p-0 overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50/50 p-6 lg:p-8">
          <h3 className="text-xl font-black text-slate-900 tracking-tight">Matriks Rule (Binary)</h3>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            {penyakitList.length} Penyakit &times; {gejalaList.length} Gejala = {penyakitList.length * gejalaList.length} kombinasi
          </p>
        </div>

        <div className="overflow-x-auto p-6 lg:p-8">
          <table className="w-full text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b-2 border-slate-300">
                <th className="h-14 px-4 text-left font-black text-xs uppercase tracking-wider text-slate-700 sticky left-0 bg-white z-10 border-r border-slate-200">
                  Gejala
                </th>
                {penyakitList.map((p) => (
                  <th key={p.id} className="h-14 px-4 text-center font-black text-xs uppercase tracking-wider text-slate-700">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-primary">{p.kode}</span>
                      <span className="text-[10px] font-bold text-slate-500 normal-case max-w-[80px] truncate">{p.nama}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {gejalaList.map((g, idx) => (
                <tr key={g.id} className={`border-b border-slate-100 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"} hover:bg-slate-100/50 transition-colors`}>
                  <td className="p-4 px-4 sticky left-0 bg-inherit z-10 border-r border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-primary text-xs">{g.kode}</span>
                      <span className="font-bold text-slate-700 text-xs max-w-[180px] truncate">{g.nama}</span>
                    </div>
                  </td>
                  {penyakitList.map((p) => {
                    const val = ruleMap.get(`${p.id}:${g.id}`) ?? 0;
                    return (
                      <td key={p.id} className="p-4 px-4 text-center">
                        {val >= 1 ? (
                          <div className="inline-flex size-8 items-center justify-center rounded-lg bg-emerald-100 border border-emerald-200">
                            <CheckCircle2 className="size-4 text-emerald-600" strokeWidth={3} />
                          </div>
                        ) : (
                          <div className="inline-flex size-8 items-center justify-center rounded-lg bg-slate-100 border border-slate-200">
                            <XCircle className="size-4 text-slate-400" strokeWidth={2} />
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
