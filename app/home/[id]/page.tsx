import { createReservation } from "@/app/actions";
import { CategoryShowcase } from "@/app/components/CategoryShowcase";
import { HomeImageCarousel } from "@/app/components/HomeImageCarousel";
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
  const country = getCountryByValue(data?.country as string);
  const { getUser } = getKindeServerSession();
  const kindeUser = await getUser();
  const dbUser = await getCurrentUser();

  const isOwner = !!dbUser?.id && data?.userId === dbUser.id;

  return (
    <div className="container mx-auto mb-16 mt-6 md:mt-10">
      <div className="grid gap-6 md:grid-cols-[3fr_2fr] md:gap-8 md:items-start">
        {/* LEFT — sticky on scroll, contains images + description + map */}
        <div className="md:sticky md:top-20">
          <HomeImageCarousel images={images} />

          <div className="mt-5 flex items-start justify-between gap-4">
            <h1 className="text-2xl font-medium md:text-3xl">{data?.title}</h1>
            {isOwner && (
              <Button
                nativeButton={false}
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

          <div className="mt-8 space-y-8">
            <div>
              <h3 className="text-xl font-medium">
                {country?.flag} {country?.label} / {country?.region}
              </h3>
              <div className="mt-1 flex flex-wrap gap-x-2 text-muted-foreground">
                <p>{data?.guests} Guests</p>
                <span aria-hidden>·</span>
                <p>{data?.bedrooms} Bedrooms</p>
                <span aria-hidden>·</span>
                <p>{data?.bathrooms} Bathrooms</p>
              </div>
            </div>

            <div className="flex items-center">
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

            <Separator />

            <CategoryShowcase categoryName={data?.categoryName as string} />

            <Separator />

            <div>
              <h3 className="mb-2 text-lg font-medium">About this place</h3>
              <p className="whitespace-pre-line text-muted-foreground">
                {data?.description}
              </p>
            </div>

            <Separator />

            <div>
              <h3 className="mb-2 text-lg font-medium">Where you&apos;ll be</h3>
              <HomeMap locationValue={country?.value as string} />
            </div>
          </div>
        </div>

        {/* RIGHT — info + reservation calendar */}
        <form
          action={createReservation}
          className="rounded-2xl border bg-card p-6 shadow-sm md:sticky md:top-20"
        >
          <input type="hidden" name="homeId" value={id} />

          <div className="mb-4 flex items-baseline justify-between">
            <p className="text-2xl font-semibold">
              ${data?.price}
              <span className="text-base font-normal text-muted-foreground">
                {" "}
                / night
              </span>
            </p>
          </div>

          <Separator className="mb-4" />

          <SelectCalender reservation={data?.Reservation} />

          {kindeUser?.id ? (
            <div className="mt-6">
              <ReservationSubmitButton />
            </div>
          ) : (
            <Button
              className="mt-6 w-full"
              nativeButton={false}
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
