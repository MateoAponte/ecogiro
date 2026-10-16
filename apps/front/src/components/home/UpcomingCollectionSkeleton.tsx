import { Skeleton } from "@/components/ui/skeleton";

export function UpcomingCollectionSkeleton() {
  return (
    <div className="eco-card block space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="w-4 h-4 rounded" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="w-4 h-4 rounded" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="w-4 h-4 rounded" />
          <Skeleton className="h-4 w-56" />
        </div>
      </div>

      <div className="flex items-center justify-end gap-1 pt-1">
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}
