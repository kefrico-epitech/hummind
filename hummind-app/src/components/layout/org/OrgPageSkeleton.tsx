type OrgPageSkeletonProps = {
  variant?: "overview" | "detail" | "course";
};

function SkeletonLine({ className }: { className: string }) {
  return <div className={`rounded-full bg-white/10 ${className}`} />;
}

function SkeletonCard() {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_22px_45px_rgba(0,0,0,0.18)]">
      <div className="h-12 w-12 rounded-full bg-white/10" />
      <SkeletonLine className="mt-5 h-5 w-40" />
      <SkeletonLine className="mt-3 h-3 w-full" />
      <SkeletonLine className="mt-2 h-3 w-3/4" />
      <SkeletonLine className="mt-6 h-10 w-full" />
    </div>
  );
}

function DetailVariant() {
  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-start">
          <div className="h-20 w-20 rounded-full bg-white/10" />
          <div className="flex-1">
            <SkeletonLine className="h-3 w-36" />
            <SkeletonLine className="mt-4 h-8 w-72 max-w-full" />
            <SkeletonLine className="mt-4 h-4 w-full max-w-3xl" />
            <SkeletonLine className="mt-2 h-4 w-5/6 max-w-2xl" />
            <div className="mt-6 flex flex-wrap gap-3">
              <SkeletonLine className="h-10 w-36" />
              <SkeletonLine className="h-10 w-40" />
              <SkeletonLine className="h-10 w-12 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
        <div className="flex flex-wrap gap-6 border-b border-white/10 pb-4">
          <SkeletonLine className="h-4 w-28" />
          <SkeletonLine className="h-4 w-24" />
          <SkeletonLine className="ml-auto h-10 w-56" />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    </div>
  );
}

function CourseVariant() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
        <div className="flex flex-wrap items-center gap-4">
          <SkeletonLine className="h-10 w-10 rounded-full" />
          <div className="flex-1">
            <SkeletonLine className="h-4 w-28" />
            <SkeletonLine className="mt-3 h-8 w-80 max-w-full" />
          </div>
          <SkeletonLine className="h-10 w-28" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-4 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <SkeletonLine className="h-5 w-52" />
          <SkeletonLine className="h-4 w-full" />
          <SkeletonLine className="h-4 w-11/12" />
          <SkeletonLine className="h-4 w-4/5" />
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <SkeletonLine className="h-4 w-40" />
            <SkeletonLine className="mt-4 h-28 w-full rounded-2xl" />
            <div className="mt-4 flex gap-3">
              <SkeletonLine className="h-10 w-32" />
              <SkeletonLine className="h-10 w-28" />
            </div>
          </div>
        </div>

        <div className="space-y-3 rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <SkeletonLine className="h-4 w-24" />
          <SkeletonLine className="h-14 w-full rounded-2xl" />
          <SkeletonLine className="h-14 w-full rounded-2xl" />
          <SkeletonLine className="h-14 w-full rounded-2xl" />
          <SkeletonLine className="h-14 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

export function OrgPageSkeleton({
  variant = "overview",
}: OrgPageSkeletonProps) {
  return (
    <div className="animate-pulse space-y-6">
      {variant === "detail" ? (
        <DetailVariant />
      ) : variant === "course" ? (
        <CourseVariant />
      ) : (
        <>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <SkeletonLine className="h-8 w-52" />
              <SkeletonLine className="mt-3 h-4 w-80 max-w-full" />
            </div>
            <SkeletonLine className="h-11 w-52 rounded-full" />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </>
      )}
    </div>
  );
}
