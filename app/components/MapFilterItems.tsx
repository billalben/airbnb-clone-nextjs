"use client";

import Link from "next/link";
import { categoryItems } from "../lib/categoryItems";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";

export function MapFilterItems() {
  const searchParams = useSearchParams();
  const search = searchParams.get("filter");
  const pathname = usePathname();

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(name, value);
      return params.toString();
    },
    [searchParams],
  );

  const renderedItems = useMemo(() => {
    return categoryItems.map(({ id, name, imageUrl, title }) => (
      <Link
        key={id}
        href={`${pathname}?${createQueryString("filter", name)}`}
        className={cn(
          "min-w-32 space-y-3 border-b-2 border-transparent py-2",
          search === name ? "border-black" : "opacity-60",
          "transition-all hover:bg-slate-200 hover:opacity-100",
        )}
      >
        <div className="relative mx-auto h-6 w-6">
          <Image
            src={imageUrl}
            alt={`${title} category image`}
            className="h-6 w-6"
            width={24}
            height={24}
          />
        </div>
        <p className="text-center text-xs font-medium">{title}</p>
      </Link>
    ));
  }, [createQueryString, search, pathname]);

  return (
    <div className="no-scrollbar mt-2 flex w-full items-center overflow-x-scroll">
      {renderedItems}
    </div>
  );
}
