"use client";

import { Heart } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function FavoriteButton({
  homeId,
  userId,
  pathName,
  initialIsFav,
  toggleAction,
}: {
  homeId: string;
  userId: string;
  pathName: string;
  initialIsFav: boolean;
  toggleAction: (formData: FormData) => Promise<unknown>;
}) {
  const [pending, startTransition] = useTransition();
  const [isFav, setIsFav] = useState(initialIsFav);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const formData = new FormData(e.currentTarget);
    const wasFav = isFav;
    setIsFav(!wasFav);
    startTransition(async () => {
      try {
        await toggleAction(formData);
      } catch (err) {
        console.error("[toggleFavorite]", err);
        setIsFav(wasFav);
        toast.error("Could not update favorites. Please try again.");
      }
    });
  };

  return (
    <form
      key={`fav-${homeId}`}
      onClick={(e) => e.stopPropagation()}
      onSubmit={onSubmit}
    >
      <input type="hidden" name="homeId" value={homeId} />
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="pathName" value={pathName} />
      <HeartButton
        filled={isFav}
        disabled={pending}
        label={isFav ? "Remove from favorites" : "Add to favorites"}
      />
    </form>
  );
}

export function FavoriteLoginLink() {
  return (
    <Link
      href="/api/auth/login"
      onClick={(e) => e.stopPropagation()}
      aria-label="Log in to save"
      className="group inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/25 transition-all hover:bg-black/40 active:scale-90"
    >
      <Heart
        className="h-5 w-5 text-white transition-transform group-hover:scale-110"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.25}
      />
    </Link>
  );
}

function HeartButton({
  filled,
  disabled,
  label,
}: {
  filled: boolean;
  disabled: boolean;
  label: string;
}) {
  return (
    <button
      type="submit"
      onClick={(e) => e.stopPropagation()}
      disabled={disabled}
      aria-label={label}
      aria-pressed={filled}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-full transition-all hover:scale-110 active:scale-90",
        "bg-black/25 hover:bg-black/40",
      )}
    >
      <Heart
        className={cn(
          "h-5 w-5 transition-colors duration-200",
          filled ? "text-red-500" : "text-white",
        )}
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={2.25}
      />
    </button>
  );
}
