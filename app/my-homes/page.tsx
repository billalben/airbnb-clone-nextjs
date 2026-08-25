import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import prisma from "../lib/db";
import { redirect } from "next/navigation";
import { NoItems } from "../components/NoItem";
import { ListingCardClient } from "../components/ListingCardClient";
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
      title: true,
      country: true,
      description: true,
      price: true,
      images: {
        orderBy: [{ isPrimary: "desc" }, { position: "asc" }],
        select: { path: true },
      },
      Favorite: {
        where: {
          userId: userId,
        },
        select: { id: true },
        take: 1,
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
  const allPaths = data.flatMap((h) => h.images.map((i) => i.path));
  const urls = await getImageUrls(allPaths);
  let cursor = 0;
  const items = data.map((h) => {
    const homeUrls = h.images.map(() => urls[cursor++] ?? null);
    return {
      id: h.id,
      title: h.title,
      country: h.country,
      description: h.description,
      price: h.price,
      imageUrls: homeUrls,
      isInFavoriteList: (h.Favorite[0]?.id ?? null) !== null,
    };
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
              imageUrls={item.imageUrls}
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
