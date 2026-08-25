import { createReservation } from "@/app/actions";
import { CategoryShowcase } from "@/app/components/CategoryShowcase";
import { HomeMap } from "@/app/components/HomeMap";
import { SelectCalender } from "@/app/components/SelectCalender";
import { ReservationSubmitButton } from "@/app/components/SubmitButtons";
import prisma from "@/app/lib/db";
import { getCountryByValue } from "@/app/lib/getCountries";
import { getImageUrls } from "@/app/lib/supabase/storage";
import { getCurrentUser } from "@/app/lib/auth";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { Pencil } from "lucide-react";

async function getData(homeId: string) {
  await connection();
  const data = await prisma.home.findUnique({
    where: { id: homeId },
    select: {
      id: true,
      userId: true,
      description: true,
      guests: true,
      bedrooms: true,
      bathrooms: true,
      title: true,
      categoryName: true,
      price: true,
      country: true,
      images: {
        orderBy: [{ isPrimary: "desc" }, { position: "asc" }],
        select: { id: true, path: true, isPrimary: true },
      },
      Reservation: {
        where: { homeId },
        select: { startDate: true, endDate: true },
      },
      User: {
        select: { profileImage: true, firstName: true },
      },
    },
  });

  return data;
}

export default async function HomeRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getData(id);
  const imagePaths = data?.images?.map((i) => i.path) ?? [];
  const urls = await getImageUrls(imagePaths);
  const images =
    data?.images?.map((img, i) => ({
      id: img.id,
      url: urls[i] ?? null,
      isPrimary: img.isPrimary,
    })) ?? [];
  const primaryImage = images[0]?.url;
  const galleryImages = images.slice(1);
  const country = getCountryByValue(data?.country as string);
  const { getUser } = getKindeServerSession();
  const kindeUser = await getUser();
  const dbUser = await getCurrentUser();

  const isOwner = !!dbUser?.id && data?.userId === dbUser.id;

  return (
    <div className="container mx-auto mb-12 mt-10">
      <div className="mb-5 flex items-start justify-between gap-4">
        <h1 className="text-2xl font-medium">{data?.title}</h1>
        {isOwner && (
          <Button
            render={
              <Link href={`/my-homes/${data?.id}/edit`}>
                <Pencil className="mr-1 h-4 w-4" />
                Edit
              </Link>
            }
            variant="outline"
            size="sm"
          />
        )}
      </div>
      <div className="relative h-[420px] md:h-[550px]">
        {primaryImage ? (
          <Image
            alt="Image of Home"
            src={primaryImage}
            fill
            className="h-full w-full rounded-lg object-cover"
          />
        ) : (
          <div className="h-full w-full rounded-lg bg-muted" />
        )}
      </div>

      {galleryImages.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {galleryImages.map((img) =>
            img.url ? (
              <div
                key={img.id}
                className="relative aspect-square overflow-hidden rounded-md bg-muted"
              >
                <Image
                  src={img.url}
                  alt="Home gallery"
                  fill
                  className="object-cover"
                />
              </div>
            ) : null,
          )}
        </div>
      )}

      <div className="relative mt-8 grid gap-12 md:grid-cols-[1fr_332px]">
        <div>
          <h3 className="text-xl font-medium">
            {country?.flag} {country?.label} / {country?.region}
          </h3>
          <div className="flex gap-x-2 text-muted-foreground">
            <p>{data?.guests} Guests</p> * <p>{data?.bedrooms} Bedrooms</p> *{" "}
            {data?.bathrooms} Bathrooms
          </div>

          <div className="mt-6 flex items-center">
            <Image
              src={data?.User?.profileImage ?? "/user.png"}
              width={44}
              height={44}
              alt="User Profile"
              className="rounded-full"
            />
            <div className="ml-4 flex flex-col">
              <h3 className="font-medium">Hosted by {data?.User?.firstName}</h3>
              <p className="text-sm text-muted-foreground">Host since 2023</p>
            </div>
          </div>

          <Separator className="my-7" />

          <CategoryShowcase categoryName={data?.categoryName as string} />

          <Separator className="my-7" />

          <p className="text-muted-foreground">{data?.description}</p>

          <Separator className="my-7" />

          <HomeMap locationValue={country?.value as string} />
        </div>

        <form action={createReservation} className="mx-auto">
          <input type="hidden" name="homeId" value={id} />

          <SelectCalender reservation={data?.Reservation} />

          {kindeUser?.id ? (
            <ReservationSubmitButton />
          ) : (
            <Button
              className="mx-auto block w-fit"
              render={<Link href="/api/auth/login" />}
            >
              Make a Reservation
            </Button>
          )}
        </form>
      </div>
    </div>
  );
}
