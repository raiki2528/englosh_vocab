function Shimmer({ className = "" }: { className?: string }) {
  return <div className={`skeleton-shimmer rounded-lg ${className}`} aria-hidden />;
}

function SkeletonBottomNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur-sm"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-hidden
    >
      <div className="mx-auto flex h-16 max-w-md items-stretch px-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex flex-1 flex-col items-center justify-center gap-1.5"
          >
            <Shimmer className={`h-5 w-5 rounded-md ${i === 1 ? "opacity-100" : "opacity-60"}`} />
            <Shimmer className={`h-2.5 w-10 ${i === 1 ? "opacity-80" : "opacity-40"}`} />
          </div>
        ))}
      </div>
    </nav>
  );
}

export function VocabAppSkeleton() {
  return (
    <div
      className="flex min-h-dvh flex-col bg-gray-50"
      role="status"
      aria-label="読み込み中"
    >
      <main
        className="mx-auto flex h-dvh w-full max-w-md min-h-0 flex-1 flex-col px-3 py-4"
        style={{ paddingBottom: "calc(4rem + env(safe-area-inset-bottom))" }}
      >
        <div className="relative flex min-h-0 flex-1 items-center justify-center">
          <div className="flex h-[min(60vh,480px)] w-full max-h-[min(70vh,560px)] flex-col items-center justify-center rounded-3xl bg-white px-8 shadow-sm">
            <Shimmer className="h-8 w-40 max-w-[70%]" />
            <Shimmer className="mt-10 h-4 w-28 opacity-60" />
            <div className="absolute inset-x-0 bottom-12 flex flex-col items-center gap-2">
              <Shimmer className="h-12 w-12 rounded-full opacity-40" />
              <Shimmer className="h-3 w-24 opacity-40" />
            </div>
          </div>
        </div>

        <footer className="shrink-0 px-6 pb-2 pt-1 text-center">
          <Shimmer className="mx-auto h-3 w-12 opacity-50" />
        </footer>
      </main>

      <SkeletonBottomNav />
    </div>
  );
}
