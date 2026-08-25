import { Skeleton } from "@/components/ui/skeleton";

export default function HomePageLoading() {
  return (
    <div className="container mx-auto mb-16 mt-6 md:mt-10">
      <div className="grid gap-6 md:grid-cols-[3fr_2fr] md:gap-8 md:items-start">
        <div className="md:sticky md:top-20">
          <Skeleton className="aspect-[4/3] w-full rounded-xl md:aspect-[16/9]" />

          <Skeleton className="mt-5 h-8 w-2/3" />

          <div className="mt-8 space-y-8">
            <div>
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="mt-2 h-4 w-1/3" />
            </div>

            <div className="flex items-center">
              <Skeleton className="size-11 rounded-full" />
              <div className="ml-4 flex flex-col gap-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>

            <Skeleton className="h-px w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-px w-full" />

            <div className="space-y-2">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>

            <Skeleton className="h-px w-full" />

            <div className="space-y-3">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-64 w-full rounded-xl" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm md:sticky md:top-20">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="my-4 h-px w-full" />
          <Skeleton className="h-80 w-full rounded-lg" />
          <Skeleton className="mt-6 h-10 w-full" />
        </div>
      </div>
    </div>
  );
}
