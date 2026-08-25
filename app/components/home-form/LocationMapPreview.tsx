"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const LazyMap = dynamic(() => import("@/app/components/Map"), {
  ssr: false,
  loading: () => <Skeleton className="h-[50vh] w-full" />,
});

export function LocationMapPreview({ country }: { country: string }) {
  return <LazyMap locationValue={country} />;
}