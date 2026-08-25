import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { ListingCardClient } from "../components/ListingCardClient";
import { NoItems } from "../components/NoItem";
import prisma from "../lib/db";
import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { getImageUrls } from "../lib/supabase/storage";

async function getData(userId: string) {
  noStore();
  const data = await prisma.reservation.findMany({
    where: { userId },
    select: {
      id: true,
      Home: {
        select: {
          id: true,
          title: true,
          country: true,
          description: true,
          price: true,
          Favorite: { select: { id: true }, take: 1 },
          images: {
            orderBy: [{ isPrimary: "desc" }, { position: "asc" }],
            select: { path: true },
          },
        },
      },
    },
  });
  return data;
}

export default async function ReservationsRoute() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user?.id) return redirect("/");
  const data = await getData(user.id);

  const allPaths = data.flatMap(
    (item) => item.Home?.images.map((i) => i.path) ?? [],
  );
  const urls = await getImageUrls(allPaths);
  let cursor = 0;
  const items = data
    .filter((item) => item.Home != null)
    .map((item) => {
      const homeUrls =
        item.Home?.images.map(() => urls[cursor++] ?? null) ?? [];
      return {
        id: item.Home!.id,
        title: item.Home!.title,
        country: item.Home!.country,
        description: item.Home!.description,
        price: item.Home!.price,
        imageUrls: homeUrls,
        isInFavoriteList: (item.Home!.Favorite[0]?.id ?? null) !== null,
      };
    });

  return (
    <section className="container mx-auto mt-10 px-5 lg:px-10">
      <h2 className="text-3xl font-semibold tracking-tight">
        Your Reservations
      </h2>

      {items.length === 0 ? (
        <NoItems
          title="Hey you don&#x27;t have any Reservations"
          description="Please add a reservation to see it right here..."
        />
      ) : (
        <div className="my-8 grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <ListingCardClient
              key={item.id}
              imageUrls={item.imageUrls}
              title={item.title}
              location={item.country}
              pathName="/reservations"
              homeId={item.id}
              price={item.price}
              userId={user.id}
              isInFavoriteList={item.isInFavoriteList}
            />
          ))}
        </div>
      )}
    </section>
  );
}
