"use client";

import Link from "next/link";
import { categoryItems } from "../lib/categoryItems";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

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
    return categoryItems.map(({ id, name, icon: Icon, title }) => {
      const isActive = search === name;
      const href = isActive
        ? pathname
        : `${pathname}?${createQueryString("filter", name)}`;

      return (
        <CarouselItem
          key={id}
          className="basis-1/3 sm:basis-1/4 md:basis-1/6 lg:basis-1/8"
        >
          <Link
            href={href}
            aria-pressed={isActive}
            className={cn(
              "flex h-full flex-col items-center justify-center gap-2 border-b-2 border-transparent px-2 py-2",
              isActive ? "border-foreground opacity-100" : "opacity-60",
              "transition-all hover:bg-muted hover:opacity-100",
            )}
          >
            <Icon className="h-6 w-6" />
            <p className="text-center text-xs font-medium">{title}</p>
          </Link>
        </CarouselItem>
      );
    });
  }, [createQueryString, search, pathname]);

  return (
    <Carousel
      opts={{ align: "start", loop: false }}
      className="mt-2 w-full"
    >
      <CarouselContent className="-ml-2">
        {renderedItems}
      </CarouselContent>
      <CarouselPrevious className="left-0 bg-background/90 shadow-md disabled:hidden" />
      <CarouselNext className="right-0 bg-background/90 shadow-md disabled:hidden" />
    </Carousel>
  );
}

