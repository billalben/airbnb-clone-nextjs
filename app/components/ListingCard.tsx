import Image from "next/image";
import Link from "next/link";
import { useCountries } from "../lib/getCountries";
import {
  AddToFavoriteForm,
  DeleteFromFavoriteForm,
} from "@/components/favorite-form";
import { DeleteFromFavorite, addToFavorite } from "../actions";

interface iAppProps {
  imageUrl: string | null;
  description: string;
  location: string;
  price: number;
  userId: string | undefined;
  isInFavoriteList: boolean;
  favoriteId?: string;
  homeId: string;
  pathName: string;
  hideLink?: boolean;
}

export function ListingCard({
  description,
  imageUrl,
  location,
  price,
  userId,
  favoriteId,
  homeId,
  isInFavoriteList,
  pathName,
  hideLink,
}: iAppProps) {
  const { getCountryByValue } = useCountries();
  const country = getCountryByValue(location);

  const content = (
    <>
      <div className="relative h-72">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt="Image of House"
            fill
            className="h-full rounded-lg object-cover"
          />
        ) : (
          <div className="h-full w-full rounded-lg bg-muted" />
        )}

        {userId && favoriteId !== undefined && (
          <div className="absolute right-2 top-2 z-10">
            {isInFavoriteList && favoriteId ? (
              <DeleteFromFavoriteForm
                favoriteId={favoriteId}
                userId={userId}
                pathName={pathName}
                deleteAction={DeleteFromFavorite}
              />
            ) : (
              <AddToFavoriteForm
                homeId={homeId}
                userId={userId}
                pathName={pathName}
                addAction={addToFavorite}
              />
            )}
          </div>
        )}
      </div>

      <div className="mt-2 p-4">
        <h3 className="text-base font-medium">
          {country?.flag} {country?.label} / {country?.region}
        </h3>
        <p
          className="line-clamp-2 text-sm text-muted-foreground"
          title={description}
        >
          {description}
        </p>
        <p className="pt-2 text-muted-foreground">
          <span className="font-medium text-foreground">${price}</span> Night
        </p>
      </div>
    </>
  );

  if (hideLink) {
    return <div className="flex flex-col">{content}</div>;
  }

  return (
    <div className="flex flex-col border rounded-lg overflow-hidden">
      <Link href={`/home/${homeId}`}>{content}</Link>
    </div>
  );
}
