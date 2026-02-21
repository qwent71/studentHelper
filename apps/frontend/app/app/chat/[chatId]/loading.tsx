import { Skeleton } from "@student-helper/ui/web/primitives/skeleton";

export default function ChatDetailLoading() {
  return (
    <div className="flex h-full flex-1 flex-col">
      <div className="flex-1 space-y-4 p-4">
        {/* User message skeleton */}
        <div className="flex justify-end">
          <Skeleton className="h-10 w-2/3 rounded-2xl" />
        </div>

        {/* Assistant message skeleton */}
        <div className="flex justify-start">
          <div className="space-y-2">
            <Skeleton className="h-16 w-80 rounded-2xl" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>

        {/* User message skeleton */}
        <div className="flex justify-end">
          <Skeleton className="h-10 w-1/2 rounded-2xl" />
        </div>

        {/* Assistant message skeleton */}
        <div className="flex justify-start">
          <div className="space-y-2">
            <Skeleton className="h-24 w-72 rounded-2xl" />
            <Skeleton className="h-4 w-36" />
          </div>
        </div>
      </div>

      {/* Input skeleton */}
      <div className="border-t p-4">
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    </div>
  );
}
