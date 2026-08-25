import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import prisma from "../lib/db";
import { redirect } from "next/navigation";
import { NoItems } from "../components/NoItem";
import { ListingCard } from "../components/ListingCard";
import { DeleteHomeButton } from "../components/DeleteHomeButton";
import { unstable_noStore as noStore } from "next/cache";
import { getImageUrls } from "../lib/supabase/storage";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";

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
      description: true,
      price: true,
      images: {
        where: { isPrimary: true },
        select: { path: true },
        take: 1,
      },
      Favorite: {
        where: {
          userId: userId,
        },
        select: { id: true },
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
    data.map(async (item) => {
      const urls = await getImageUrls(item.images.map((i) => i.path));
      return {
        ...item,
        imageUrl: urls[0] ?? null,
      };
    }),
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
            <div
              key={item.id}
              className="flex flex-col rounded-lg border bg-card"
            >
              <ListingCard
                imageUrl={item.imageUrl}
                homeId={item.id}
                price={item.price as number}
                description={item.description as string}
                location={item.country as string}
                userId={user.id}
                pathName="/my-homes"
                favoriteId={item.Favorite[0]?.id}
                isInFavoriteList={item.Favorite.length > 0 ? true : false}
                hideLink
              />
              <div className="flex gap-2 p-4 pt-0">
                <Button
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
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
