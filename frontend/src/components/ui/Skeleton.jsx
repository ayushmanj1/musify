export function Skeleton({ className = '', variant = 'rect' }) {
  const baseClass = 'skeleton-shimmer'
  
  if (variant === 'circle') {
    return <div className={`${baseClass} rounded-full ${className}`} />
  }
  
  return <div className={`${baseClass} ${className}`} />
}

export function SongCardSkeleton() {
  return (
    <div className="bg-[#111] rounded-[28px] p-3 w-[150px] md:w-[185px] border border-white/5">
      <Skeleton className="w-full aspect-square rounded-[20px] mb-3" />
      <Skeleton className="h-4 w-3/4 mb-2 rounded-md" />
      <Skeleton className="h-3 w-1/2 rounded-md" />
    </div>
  )
}

export function SongRowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-3 rounded-xl">
      <Skeleton className="w-12 h-12 rounded-lg flex-shrink-0" />
      <div className="flex-1">
        <Skeleton className="h-4 w-48 mb-2" />
        <Skeleton className="h-3 w-32" />
      </div>
      <Skeleton className="h-8 w-8 rounded-full" />
    </div>
  )
}
