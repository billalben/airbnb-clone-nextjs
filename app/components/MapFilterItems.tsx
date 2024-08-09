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
          search === name ? "border-b-2 border-black pb-2" : "opacity-70",
          "flex flex-shrink-0 flex-col items-center gap-y-3",
        )}
      >
        <div className="relative h-6 w-6">
          <Image
            src={imageUrl}
            alt={`${title} category image`}
            className="h-6 w-6"
            width={24}
            height={24}
          />
        </div>
        <p className="text-xs font-medium">{title}</p>
      </Link>
    ));
  }, [createQueryString, search, pathname]);

  return (
    <div className="no-scrollbar mt-5 flex w-full gap-x-10 overflow-x-scroll">
      {renderedItems}
    </div>
  );
}
