export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 bg-slate-200 rounded-lg animate-pulse" />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card-container h-32 flex flex-col justify-between">
            <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
            <div className="h-8 w-16 bg-slate-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
      <div className="card-container h-96 w-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="size-10 rounded-full border-4 border-slate-100 border-t-primary animate-spin" />
          <p className="text-sm font-medium text-slate-400 animate-pulse">Memuat data...</p>
        </div>
      </div>
    </div>
  );
}
