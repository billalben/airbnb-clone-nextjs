import { Suspense } from "react";

import { MapFilterItems } from "./components/MapFilterItems";
import prisma from "./lib/db";
import { SkeltonCard } from "./components/SkeletonCard";
import { NoItems } from "./components/NoItem";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { HomeGrid } from "./components/HomeGrid";
import { connection } from "next/server";
import { getImageUrls } from "./lib/supabase/storage";
import { parseSearchParams } from "./lib/parseSearchParams";

type GridItem = {
  id: string;
  title: string | null;
  price: number | null;
  description: string | null;
  country: string | null;
  imageUrls: (string | null)[];
  isInFavoriteList: boolean;
};

async function getData(
  searchParams: ReturnType<typeof parseSearchParams>,
  userId?: string,
): Promise<GridItem[]> {
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
    orderBy: { createdAT: "desc" },
    take: 10,
    select: {
      id: true,
      title: true,
      price: true,
      description: true,
      country: true,
      images: {
        orderBy: [{ isPrimary: "desc" }, { position: "asc" }],
        select: { path: true },
      },
      Favorite: {
        where: { userId: userId ?? undefined },
        select: { id: true },
        take: 1,
      },
    },
  });

  const allPaths = data.flatMap((h) => h.images.map((i) => i.path));
  const urls = await getImageUrls(allPaths);
  let cursor = 0;

  return data.map((h) => {
    const homeUrls = h.images.map(() => urls[cursor++] ?? null);
    return {
      id: h.id,
      title: h.title,
      price: h.price,
      description: h.description,
      country: h.country,
      imageUrls: homeUrls,
      isInFavoriteList: (h.Favorite[0]?.id ?? null) !== null,
    };
  });
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

  if (data.length === 0) {
    return (
      <NoItems
        description="Please check a other category or create your own listing!"
        title="Sorry no listings found for this category..."
      />
    );
  }

  return (
    <HomeGrid
      initialItems={data}
      userId={user?.id}
      pathName="/"
      filterParams={searchParams}
    />
  );
}

function SkeletonLoading() {
  return (
    <div className="mt-8 grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <SkeltonCard key={index} />
      ))}
    </div>
  );
}
