export default function CourseLiveLoading() {
  return (
    <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden bg-[#262628] text-white">
      <header className="border-b border-white/6 bg-background px-4 py-4 sm:px-6 lg:px-10">
        <div className="grid animate-pulse grid-cols-[minmax(0,1fr)_auto] items-center gap-3 md:grid-cols-[minmax(0,18rem)_minmax(18rem,34rem)_18rem] md:gap-5 lg:grid-cols-[minmax(0,20rem)_minmax(20rem,40rem)_20rem]">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="h-7 w-7 shrink-0 rounded-full bg-white/10" />
            <div className="h-4 w-40 max-w-full rounded-full bg-white/10" />
          </div>

          <div className="hidden w-full max-w-[40rem] justify-self-center md:block">
            <div className="h-2 w-full rounded-full bg-white/10" />
          </div>

          <div className="flex items-center justify-end gap-2.5">
            <div className="h-9 w-9 rounded-full bg-white/10" />
            <div className="h-9 w-9 rounded-full bg-white/10" />
          </div>
        </div>

        <div className="mt-2.5 animate-pulse md:hidden">
          <div className="h-2 w-full rounded-full bg-white/10" />
        </div>
      </header>

      <div className="min-h-0 overflow-y-auto">
        <div className="mx-auto w-full max-w-5xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-4xl space-y-4 animate-pulse">
            <div className="flex items-start gap-2.5">
              <div className="mt-1 h-9 w-9 shrink-0 rounded-full bg-white/10" />
              <div className="min-w-0 flex-1 rounded-[1.45rem] rounded-tl-md border border-white/8 bg-[#2E2F34] px-4 py-4">
                <div className="h-3 w-24 rounded-full bg-white/10" />
                <div className="mt-4 h-8 w-3/4 rounded-full bg-white/10" />
                <div className="mt-6 space-y-3">
                  <div className="h-3 w-full rounded-full bg-white/10" />
                  <div className="h-3 w-[94%] rounded-full bg-white/10" />
                  <div className="h-3 w-[82%] rounded-full bg-white/10" />
                  <div className="h-3 w-[88%] rounded-full bg-white/10" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
