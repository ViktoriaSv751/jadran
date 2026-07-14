/** Route-szintű betöltő — finom, márka-semleges skeleton (nyelvfüggetlen). */
export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="shimmer h-8 w-52 rounded-lg" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-soft">
            <div className="shimmer aspect-[4/3] w-full" />
            <div className="space-y-2 p-4">
              <div className="shimmer h-4 w-3/4 rounded" />
              <div className="shimmer h-6 w-1/2 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
