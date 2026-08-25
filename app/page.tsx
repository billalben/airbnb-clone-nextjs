import { Suspense } from "react";

import { MapFilterItems } from "./components/MapFilterItems";
import prisma from "./lib/db";
import { SkeltonCard } from "./components/SkeletonCard";
import { NoItems } from "./components/NoItem";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { ListingCard } from "./components/ListingCard";
import { connection } from "next/server";
import { getImageUrls } from "./lib/supabase/storage";
import { parseSearchParams } from "./lib/parseSearchParams";

async function getData(
  searchParams: ReturnType<typeof parseSearchParams>,
  userId?: string,
) {
  await connection();
  const data = await prisma.home.findMany({
    where: {
      addedCategory: true,
      addedLocation: true,
      addedDescription: true,
      categoryName: searchParams?.filter ?? undefined,
      country: searchParams?.country ?? undefined,
      guests: searchParams?.guest ?? undefined,
      bedrooms: searchParams?.room ?? undefined,
      bathrooms: searchParams?.bathroom ?? undefined,
    },
    select: {
      id: true,
      price: true,
      description: true,
      country: true,
      images: {
        where: { isPrimary: true },
        select: { path: true },
        take: 1,
      },
      Favorite: {
        where: { userId: userId ?? undefined },
        select: { id: true },
      },
    },
  });
  return data;
}

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const params = parseSearchParams(raw);

  return (
    <div className="container mx-auto px-5 lg:px-10">
      <MapFilterItems />

      <Suspense fallback={<SkeletonLoading />}>
        <ShowItems {...params} />
      </Suspense>
    </div>
  );
}

async function ShowItems(
  searchParams: ReturnType<typeof parseSearchParams>,
) {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  const data = await getData(searchParams, user?.id);

  const items = await Promise.all(
    data.map(async (item) => {
      const urls = await getImageUrls(item.images.map((i) => i.path));
      return {
        ...item,
        imageUrl: urls[0] ?? null,
      };
    }),
  );

  return (
    <>
      {items.length === 0 ? (
        <NoItems
          description="Please check a other category or create your own listing!"
          title="Sorry no listings found for this category..."
        />
      ) : (
        <div className="mt-8 grid gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <ListingCard
              key={item.id}
              description={item.description as string}
              imageUrl={item.imageUrl}
              location={item.country as string}
              price={item.price as number}
              userId={user?.id}
              favoriteId={item.Favorite[0]?.id}
              isInFavoriteList={item.Favorite.length > 0 ? true : false}
              homeId={item.id}
              pathName="/"
            />
          ))}
        </div>
      )}
    </>
  );
}

function SkeletonLoading() {
  return (
    <div className="mt-8 grid gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <SkeltonCard key={index} />
      ))}
    </div>
  );
}
