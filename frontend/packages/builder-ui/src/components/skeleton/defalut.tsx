"use client";

import { Skeleton } from "@stackloom/ui/components/skeleton";

export function DefaultSkeleton() {
  return (
    <div className="flex items-center space-x-4">
      <Skeleton className="h-16 w-full" />
    </div>
  );
}
