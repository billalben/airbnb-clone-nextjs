import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import prisma from "../lib/db";
import { redirect } from "next/navigation";
import { NoItems } from "../components/NoItem";
import { ListingCard } from "../components/ListingCard";
import { unstable_noStore as noStore } from "next/cache";
import { getImageUrl } from "../lib/supabase/storage";

async function getData(userId: string) {
  noStore();
  const data = await prisma.home.findMany({
    where: {
      userId: userId,
      addedCategory: true,
      addedDescription: true,
      addedLocation: true,
    },
    select: {
      id: true,
      country: true,
      photo: true,
      description: true,
      price: true,
      Favorite: {
        where: {
          userId: userId,
        },
      },
    },
    orderBy: {
      createdAT: "desc",
    },
  });

  return data;
}

export default async function MyHomes() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user) {
    return redirect("/");
  }
  const data = await getData(user.id);
  const items = await Promise.all(
    data.map(async (item) => ({
      ...item,
      imageUrl: await getImageUrl(item.photo),
    })),
  );
  return (
    <section className="container mx-auto mt-10 px-5 lg:px-10">
      <h2 className="text-3xl font-semibold tracking-tight">Your Homes</h2>

      {items.length === 0 ? (
        <NoItems
          description="Please list a home on airbnb so that you can see it right here"
          title="Your don&#x27;t have any Homes listed"
        />
      ) : (
        <div className="mt-8 grid gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <ListingCard
              key={item.id}
              imageUrl={item.imageUrl}
              homeId={item.id}
              price={item.price as number}
              description={item.description as string}
              location={item.country as string}
              userId={user.id}
              pathName="/my-homes"
              favoriteId={item.Favorite[0]?.id}
              isInFavoriteList={item.Favorite.length > 0 ? true : false}
            />
          ))}
        </div>
      )}
    </section>
  );
}
