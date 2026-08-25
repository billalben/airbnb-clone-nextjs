"use client";

import Image from "next/image";
import Link from "next/link";
import { useCountries } from "../lib/getCountries";
import { FavoriteButton, FavoriteLoginLink } from "@/components/favorite-form";
import { toggleFavorite } from "../actions";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface iAppProps {
  imageUrls: (string | null)[];
  title: string | null;
  location: string | null;
  price: number | null;
  userId: string | undefined;
  isInFavoriteList: boolean;
  homeId: string;
  pathName: string;
  hideLink?: boolean;
  className?: string;
  actions?: React.ReactNode;
}

export function ListingCardClient({
  imageUrls,
  title,
  location,
  price,
  userId,
  isInFavoriteList,
  homeId,
  pathName,
  hideLink,
  className,
  actions,
}: iAppProps) {
  const { getCountryByValue } = useCountries();
  const country = location ? getCountryByValue(location) : undefined;

  const validUrls = imageUrls.filter((u): u is string => Boolean(u));
  const shownUrl = validUrls[0] ?? null;

  const heart = userId ? (
    <FavoriteButton
      homeId={homeId}
      userId={userId}
      pathName={pathName}
      initialIsFav={isInFavoriteList}
      toggleAction={toggleFavorite}
    />
  ) : (
    <FavoriteLoginLink />
  );

  const media = (
    <div className="relative aspect-4/3 w-full overflow-hidden bg-muted *:[img]:rounded-none">
      {shownUrl ? (
        <Image
          src={shownUrl}
          alt={title ? `Image of ${title}` : "Image of Home"}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-opacity duration-500"
          priority={false}
        />
      ) : null}
      <div className="absolute top-3 right-3 z-10">{heart}</div>
    </div>
  );

  const info = (
    <div className="flex flex-col gap-1 px-4 py-3">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="line-clamp-1 text-[15px] font-semibold">
          {title ?? "Untitled home"}
        </h3>
        {typeof price === "number" ? (
          <p className="shrink-0 text-[15px] font-semibold">${price}</p>
        ) : null}
      </div>
      <p className="truncate text-sm text-muted-foreground">
        {country
          ? `${country.flag} ${country.label}${country.region ? `, ${country.region}` : ""}`
          : "Unknown location"}
      </p>
    </div>
  );

  const card = (
    <Card
      className={cn(
        "h-full gap-0 overflow-hidden py-0 transition-shadow hover:shadow-md",
        className,
      )}
    >
      {media}
      {info}
      {actions}
    </Card>
  );

  if (hideLink) {
    return <div className="h-full">{card}</div>;
  }

  if (actions) {
    return (
      <Card
        className={cn(
          "h-full gap-0 overflow-hidden py-0 transition-shadow hover:shadow-md",
          className,
        )}
      >
        <Link href={`/home/${homeId}`} className="group block h-full">
          {media}
          {info}
        </Link>
        {actions}
      </Card>
    );
  }

  return (
    <Link href={`/home/${homeId}`} className="group block h-full">
      {card}
    </Link>
  );
}
