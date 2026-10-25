"use client";

import Link from "next/link";
import { getCountryOption } from "../lib/countries-client";
import { FavoriteButton, FavoriteLoginLink } from "@/components/favorite-form";
import { toggleFavorite } from "../actions/favorites";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface iAppProps {
  imageUrl: string | null;
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
  imageUrl,
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
  const country = getCountryOption(location);

  const heart = userId ? (
    <FavoriteButton
      homeId={homeId}
      pathName={pathName}
      initialIsFav={isInFavoriteList}
      toggleAction={toggleFavorite}
    />
  ) : (
    <FavoriteLoginLink />
  );

  const media = (
    <div className="relative aspect-4/3 w-full overflow-hidden bg-muted *:[img]:rounded-none">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={title ? `Image of ${title}` : "Image of Home"}
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500"
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

  const cardClass = cn(
    "h-full gap-0 overflow-hidden py-0 transition-shadow hover:shadow-md",
    className,
  );

  const content = (
    <>
      {media}
      {info}
    </>
  );

  if (hideLink) {
    return (
      <div className="h-full">
        <Card className={cardClass}>
          {content}
          {actions}
        </Card>
      </div>
    );
  }

  if (actions) {
    return (
      <Card className={cardClass}>
        <Link href={`/home/${homeId}`} className="group block h-full">
          {content}
        </Link>
        {actions}
      </Card>
    );
  }

  return (
    <Link href={`/home/${homeId}`} className="group block h-full">
      <Card className={cardClass}>{content}</Card>
    </Link>
  );
}
