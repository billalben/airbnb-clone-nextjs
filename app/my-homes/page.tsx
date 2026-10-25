import { requireUser } from "../lib/auth";
import { NoItems } from "../components/NoItem";
import { ListingCardClient } from "../components/ListingCardClient";
import { DeleteHomeButton } from "../components/DeleteHomeButton";
import { connection } from "next/server";
import { findHomeCards } from "../lib/home-cards";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";

export default async function MyHomes() {
  const user = await requireUser();
  await connection();

  const items = await findHomeCards({
    where: {
      userId: user.id,
      addedCategory: true,
      addedDescription: true,
      addedLocation: true,
    },
    userId: user.id,
  });

  return (
    <section className="container mx-auto mt-10 px-5 lg:px-10">
      <h2 className="text-3xl font-semibold tracking-tight">Your Homes</h2>

      {items.length === 0 ? (
        <NoItems
          description="Please list a home on airbnb so that you can see it right here"
          title="Your don&#x27;t have any Homes listed"
        />
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <ListingCardClient
              key={item.id}
              imageUrl={item.imageUrl}
              homeId={item.id}
              title={item.title}
              price={item.price}
              location={item.country}
              userId={user.id}
              pathName="/my-homes"
              isInFavoriteList={item.isInFavoriteList}
              actions={
                <div className="flex gap-2 px-4 pb-4">
                  <Button
                    nativeButton={false}
                    render={
                      <Link href={`/my-homes/${item.id}/edit`}>
                        <Pencil className="mr-1 h-4 w-4" />
                        Edit
                      </Link>
                    }
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  />
                  <DeleteHomeButton homeId={item.id} className="flex-1" />
                </div>
              }
            />
          ))}
        </div>
      )}
    </section>
  );
}
