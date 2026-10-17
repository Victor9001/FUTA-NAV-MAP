export default function PageSkeleton() {
  return (
    <div className="flex h-full flex-col" role="status" aria-label="Loading">
      <div className="px-4 py-3">
        <div className="h-10 w-full animate-pulse rounded-lg bg-white/10" />
      </div>

      <div className="relative mx-4 mb-4 flex-1 animate-pulse overflow-hidden rounded-xl bg-white/5">
        <div className="absolute left-1/4 top-1/3 h-4 w-4 rounded-full bg-white/10" />
        <div className="absolute left-2/3 top-1/2 h-4 w-4 rounded-full bg-white/10" />
        <div className="absolute left-1/2 top-3/4 h-4 w-4 rounded-full bg-white/10" />
        <div className="absolute right-3 top-3 h-20 w-9 rounded-lg bg-white/10" />
      </div>
    </div>
  )
}