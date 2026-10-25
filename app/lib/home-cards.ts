import type { Prisma } from "../../lib/generated/prisma";
import prisma from "./db";
import { getImageUrls } from "./supabase/storage";

export type HomeCardData = {
  id: string;
  title: string | null;
  price: number | null;
  description: string | null;
  country: string | null;
  imageUrl: string | null;
  isInFavoriteList: boolean;
};

export type HomeCardRow = Prisma.HomeGetPayload<{
  select: ReturnType<typeof homeCardSelect>;
}>;

/**
 * Select used by every listing grid. Cards only render one photo, so only the
 * primary image is fetched instead of the home's whole gallery.
 */
export function homeCardSelect(userId: string | undefined) {
  return {
    id: true,
    title: true,
    price: true,
    description: true,
    country: true,
    images: {
      orderBy: [{ isPrimary: "desc" }, { position: "asc" }],
      take: 1,
      select: { path: true },
    },
    Favorite: {
      where: { userId: userId ?? "" },
      select: { id: true },
      take: 1,
    },
  } satisfies Prisma.HomeSelect;
}

/** Maps home rows to card data, resolving every image URL in one pass. */
export async function toHomeCards(
  rows: HomeCardRow[],
): Promise<HomeCardData[]> {
  const urls = await getImageUrls(
    rows.map((row) => row.images[0]?.path ?? null),
  );

  return rows.map((row, index) => ({
    id: row.id,
    title: row.title,
    price: row.price,
    description: row.description,
    country: row.country,
    imageUrl: urls[index] ?? null,
    isInFavoriteList: row.Favorite.length > 0,
  }));
}

/** Shared query for the home grid and its "load more" server action. */
export async function findHomeCards({
  where,
  userId,
  take,
  skip,
}: {
  where: Prisma.HomeWhereInput;
  userId?: string;
  take?: number;
  skip?: number;
}): Promise<HomeCardData[]> {
  const rows = await prisma.home.findMany({
    where,
    orderBy: { createdAT: "desc" },
    take,
    skip,
    select: homeCardSelect(userId),
  });

  return toHomeCards(rows);
}
