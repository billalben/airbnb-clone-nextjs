import { Suspense } from "react";

import { MapFilterItems } from "./components/MapFilterItems";
import prisma from "./lib/db";
import { SkeltonCard } from "./components/SkeletonCard";
import { NoItems } from "./components/NoItem";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { ListingCard } from "./components/ListingCard";
import { connection } from "next/server";
import { getImageUrl } from "./lib/supabase/storage";

type TypeSearchParams = {
  filter?: string;
  country?: string;
  guest?: string;
  room?: string;
  bathroom?: string;
};

async function getData(searchParams: TypeSearchParams, userId?: string) {
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
      photo: true,
      id: true,
      price: true,
      description: true,
      country: true,
      Favorite: {
        where: {
          userId: userId ?? undefined,
        },
      },
    },
  });

  return data;
}

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<TypeSearchParams>;
}) {
  const params = await searchParams;
  return (
    <div className="container mx-auto px-5 lg:px-10">
      <MapFilterItems />

      <Suspense fallback={<SkeletonLoading />}>
        <ShowItems {...params} />
      </Suspense>
    </div>
  );
}

async function ShowItems(searchParams: TypeSearchParams) {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  const data = await getData(searchParams, user?.id);

  const items = await Promise.all(
    data.map(async (item) => ({
      ...item,
      imageUrl: await getImageUrl(item.photo),
    })),
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
