import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { ListingCard } from "../components/ListingCard";
import { NoItems } from "../components/NoItem";
import prisma from "../lib/db";
import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { getImageUrls } from "../lib/supabase/storage";

async function getData(userId: string) {
  noStore();
  const data = await prisma.favorite.findMany({
    where: { userId },
    select: {
      Home: {
        select: {
          id: true,
          Favorite: { select: { id: true } },
          price: true,
          country: true,
          description: true,
          images: {
            where: { isPrimary: true },
            select: { path: true },
            take: 1,
          },
        },
      },
    },
  });
  return data;
}

export default async function FavoriteRoute() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user) return redirect("/");
  const data = await getData(user.id);

  const items = await Promise.all(
    data.map(async (item) => {
      const urls = await getImageUrls(item.Home?.images.map((i) => i.path) ?? []);
      return {
        ...item,
        imageUrl: urls[0] ?? null,
      };
    }),
  );

  return (
    <section className="container mx-auto mt-10 px-5 lg:px-10">
      <h2 className="text-3xl font-semibold tracking-tight">Your Favorites</h2>

      {items.length === 0 ? (
        <NoItems
          title="Hey you don&#x27;t have any favorites"
          description="Please add favorites to see them right here..."
        />
      ) : (
        <div className="my-8 grid gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <ListingCard
              key={item.Home?.id}
              description={item.Home?.description as string}
              location={item.Home?.country as string}
              pathName="/favorites"
              homeId={item.Home?.id as string}
              imageUrl={item.imageUrl}
              price={item.Home?.price as number}
              userId={user.id}
              favoriteId={item.Home?.Favorite[0]?.id}
              isInFavoriteList={
                (item.Home?.Favorite.length as number) > 0 ? true : false
              }
            />
          ))}
        </div>
      )}
    </section>
  );
}
