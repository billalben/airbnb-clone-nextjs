import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { ListingCardClient } from "../components/ListingCardClient";
import { NoItems } from "../components/NoItem";
import prisma from "../lib/db";
import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { getImageUrls } from "../lib/supabase/storage";

type FavoriteGridItem = {
  id: string;
  title: string | null;
  description: string | null;
  country: string | null;
  price: number | null;
  imageUrls: (string | null)[];
  isInFavoriteList: boolean;
};

async function getData(userId: string): Promise<FavoriteGridItem[]> {
  noStore();
  const data = await prisma.favorite.findMany({
    where: { userId },
    select: {
      id: true,
      Home: {
        select: {
          id: true,
          title: true,
          price: true,
          country: true,
          description: true,
          images: {
            orderBy: [{ isPrimary: "desc" }, { position: "asc" }],
            select: { path: true },
          },
          Favorite: {
            where: { userId },
            select: { id: true },
            take: 1,
          },
        },
      },
    },
  });

  const allPaths = data.flatMap(
    (item) => item.Home?.images.map((i) => i.path) ?? [],
  );
  const urls = await getImageUrls(allPaths);
  let cursor = 0;

  return data
    .filter((item) => item.Home != null)
    .map((item) => {
      const homeUrls =
        item.Home?.images.map(() => urls[cursor++] ?? null) ?? [];
      return {
        id: item.Home!.id,
        title: item.Home!.title,
        description: item.Home!.description,
        country: item.Home!.country,
        price: item.Home!.price,
        imageUrls: homeUrls,
        isInFavoriteList: true,
      };
    });
}

export default async function FavoriteRoute() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user) return redirect("/");
  const items = await getData(user.id);

  return (
    <section className="container mx-auto mt-10 px-5 lg:px-10">
      <h2 className="text-3xl font-semibold tracking-tight">Your Favorites</h2>
      {items.length === 0 ? (
        <NoItems
          title="Hey you don&#x27;t have any favorites"
          description="Please add favorites to see them right here..."
        />
      ) : (
        <div className="my-8 grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <ListingCardClient
              key={item.id}
              imageUrls={item.imageUrls}
              title={item.title}
              location={item.country}
              price={item.price}
              userId={user.id}
              isInFavoriteList={item.isInFavoriteList}
              homeId={item.id}
              pathName="/favorites"
            />
          ))}
        </div>
      )}
    </section>
  );
}
