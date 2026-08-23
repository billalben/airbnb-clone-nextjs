"use client";

import { Skeleton } from "@/components/ui/skeleton";
import dynamic from "next/dynamic";

const LazyMap = dynamic(() => import("@/app/components/Map"), {
  ssr: false,
  loading: () => <Skeleton className="h-[50vh] w-full" />,
});

export function HomeMap({ locationValue }: { locationValue: string }) {
  return <LazyMap locationValue={locationValue} />;
}
