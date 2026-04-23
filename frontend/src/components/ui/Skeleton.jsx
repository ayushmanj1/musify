export function SongCardSkeleton() {
  return (
    <div className="p-3 md:p-4 rounded-[24px] glass-card">
      <div className="aspect-square mb-4 rounded-[16px] skeleton-shimmer" />
      <div className="flex flex-col gap-2 px-0.5">
        <div className="h-4 rounded-full skeleton-shimmer w-3/4" />
        <div className="h-3 rounded-full skeleton-shimmer w-1/2" />
      </div>
    </div>
  )
}
