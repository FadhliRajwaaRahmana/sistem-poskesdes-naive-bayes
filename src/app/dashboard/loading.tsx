function ShimmerBlock({ className, style }: { className: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`rounded-lg bg-slate-200 animate-shimmer relative overflow-hidden ${className}`}
      style={style}
    >
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_1.5s_infinite]" />
    </div>
  );
}

export default function DashboardLoading() {
  return (
    <section className="space-y-6 pb-10 animate-fade-in">
      {/* High-Contrast Hero Banner Skeleton */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between p-8 rounded-2xl bg-slate-900 overflow-hidden relative">
        <div className="space-y-3 relative z-10 w-full max-w-md">
          <ShimmerBlock className="h-8 w-64 bg-slate-700/50" />
          <ShimmerBlock className="h-4 w-full bg-slate-700/50" />
        </div>
        <div className="relative z-10 flex flex-wrap gap-3">
          <ShimmerBlock className="h-12 w-40 rounded-xl bg-slate-700/50" />
          <ShimmerBlock className="h-12 w-40 rounded-xl bg-slate-700/50" />
        </div>
      </div>

      {/* Solid Stat Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="card-container">
            <div className="flex items-center justify-between">
              <ShimmerBlock className="size-12 rounded-xl" />
            </div>
            <div className="mt-6 space-y-2">
              <ShimmerBlock className="h-10 w-24 rounded-lg" />
              <ShimmerBlock className="h-4 w-32" />
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-7">
        <div className="col-span-4 card-container flex flex-col">
          <div className="flex items-center gap-4 mb-8">
            <ShimmerBlock className="size-10 rounded-lg" />
            <div className="space-y-2">
              <ShimmerBlock className="h-6 w-40" />
              <ShimmerBlock className="h-4 w-56" />
            </div>
          </div>
          <div className="mt-auto grid grid-cols-7 items-end gap-3 sm:gap-6 h-[240px]">
            {Array.from({ length: 7 }).map((_, index) => (
              <div key={index} className="flex flex-col items-center gap-3 h-full justify-end">
                <ShimmerBlock className="h-4 w-8" />
                <ShimmerBlock
                  className="w-full rounded-t-lg rounded-b-sm"
                  style={{ height: `${20 + index * 10}%` }}
                />
                <ShimmerBlock className="h-4 w-12 mt-1" />
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-3 space-y-6">
          <div className="card-container">
            <div className="flex items-center gap-4 mb-8">
              <ShimmerBlock className="size-10 rounded-lg" />
              <div className="space-y-2">
                <ShimmerBlock className="h-6 w-40" />
                <ShimmerBlock className="h-4 w-48" />
              </div>
            </div>
            <div className="mt-8 space-y-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <ShimmerBlock className="h-5 w-32" />
                    <ShimmerBlock className="h-7 w-24 rounded-md" />
                  </div>
                  <ShimmerBlock className="h-2.5 w-full rounded-full" />
                </div>
              ))}
            </div>
          </div>

          <div className="card-container">
            <div className="flex items-center gap-4 mb-6">
              <ShimmerBlock className="size-10 rounded-lg" />
              <ShimmerBlock className="h-6 w-40" />
            </div>
            <div className="space-y-4">
              <div className="rounded-xl border-2 border-slate-100 p-4 space-y-2">
                <ShimmerBlock className="h-4 w-32" />
                <ShimmerBlock className="h-5 w-full" />
              </div>
              <div className="rounded-xl border-2 border-slate-100 p-4 space-y-2">
                <ShimmerBlock className="h-4 w-32" />
                <ShimmerBlock className="h-5 w-48" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card-container !p-0 overflow-hidden">
        <div className="flex items-center justify-between border-b-2 border-slate-100 p-6 sm:p-8 bg-slate-50/50">
          <div className="flex items-center gap-4">
            <ShimmerBlock className="size-10 rounded-lg" />
            <div className="space-y-2">
              <ShimmerBlock className="h-6 w-40" />
              <ShimmerBlock className="h-4 w-56" />
            </div>
          </div>
          <ShimmerBlock className="h-10 w-40 rounded-lg hidden sm:block" />
        </div>

        <div className="p-6 sm:p-8 space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="flex flex-col gap-4 rounded-xl border-2 border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="space-y-3">
                <ShimmerBlock className="h-6 w-48" />
                <ShimmerBlock className="h-4 w-64" />
                <ShimmerBlock className="h-8 w-32 rounded-md mt-1" />
              </div>
              <div className="flex max-w-sm flex-wrap gap-2">
                {Array.from({ length: 3 }).map((_, badgeIndex) => (
                  <ShimmerBlock
                    key={badgeIndex}
                    className="h-6 w-16 rounded-md"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}