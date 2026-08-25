"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { ListingCardClient } from "./ListingCardClient";
import { SkeltonCard } from "./SkeletonCard";
import {
  loadMoreHomes,
  type LoadMoreHomeItem,
} from "@/app/actions";
import type { ParsedSearchParams } from "@/app/lib/parseSearchParams";

type Item = {
  id: string;
  title: string | null;
  price: number | null;
  description: string | null;
  country: string | null;
  imageUrls: (string | null)[];
  isInFavoriteList: boolean;
};

type Props = {
  initialItems: Item[];
  userId: string | undefined;
  pathName: string;
  filterParams: ParsedSearchParams;
};

export function HomeGrid({ initialItems, userId, pathName, filterParams }: Props) {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [hasMore, setHasMore] = useState(initialItems.length >= 10);
  const [pending, startTransition] = useTransition();

  const handleLoadMore = () => {
    startTransition(async () => {
      const next = (await loadMoreHomes({
        skip: items.length,
        ...filterParams,
      })) as LoadMoreHomeItem[];
      setItems((prev) => [...prev, ...next]);
      if (next.length < 10) setHasMore(false);
    });
  };

  return (
    <>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => (
          <ListingCardClient
            key={item.id}
            imageUrls={item.imageUrls}
            title={item.title}
            location={item.country}
            price={item.price}
            userId={userId}
            isInFavoriteList={item.isInFavoriteList}
            homeId={item.id}
            pathName={pathName}
          />
        ))}
      </div>

      {pending && (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeltonCard key={`skel-${i}`} />
          ))}
        </div>
      )}

      {hasMore && (
        <div className="mt-10 flex justify-center">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={handleLoadMore}
            disabled={pending}
            className="min-w-40"
          >
            {pending ? "Loading..." : "Load more"}
          </Button>
        </div>
      )}
    </>
  );
}
