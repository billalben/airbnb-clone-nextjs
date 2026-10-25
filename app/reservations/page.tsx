import { ListingCardClient } from "../components/ListingCardClient";
import { NoItems } from "../components/NoItem";
import prisma from "../lib/db";
import { requireUser } from "../lib/auth";
import { connection } from "next/server";
import { homeCardSelect, toHomeCards } from "../lib/home-cards";

export default async function ReservationsRoute() {
  const user = await requireUser();
  await connection();

  const rows = await prisma.reservation.findMany({
    where: { userId: user.id },
    select: {
      Home: { select: homeCardSelect(user.id) },
    },
  });
  const items = await toHomeCards(rows.map((row) => row.Home));

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
              imageUrl={item.imageUrl}
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
