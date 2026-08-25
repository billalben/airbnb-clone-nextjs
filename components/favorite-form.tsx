"use client";

import { Heart } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function AddToFavoriteForm({
  homeId,
  userId,
  pathName,
  addAction,
}: {
  homeId: string;
  userId: string;
  pathName: string;
  addAction: (formData: FormData) => Promise<unknown>;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(async () => {
          try {
            await addAction(formData);
            toast.success("Added to favorites");
          } catch (err) {
            toast.error(
              err instanceof Error ? err.message : "Could not add favorite.",
            );
          }
        });
      }}
    >
      <input type="hidden" name="homeId" value={homeId} />
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="pathName" value={pathName} />
      <Button
        type="submit"
        variant="outline"
        size="icon"
        disabled={pending}
        className="bg-primary-foreground"
      >
        <Heart className="h-4 w-4" />
      </Button>
    </form>
  );
}

export function DeleteFromFavoriteForm({
  favoriteId,
  userId,
  pathName,
  deleteAction,
}: {
  favoriteId: string;
  userId: string;
  pathName: string;
  deleteAction: (formData: FormData) => Promise<unknown>;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(async () => {
          try {
            await deleteAction(formData);
            toast.success("Removed from favorites");
          } catch (err) {
            toast.error(
              err instanceof Error
                ? err.message
                : "Could not remove favorite.",
            );
          }
        });
      }}
    >
      <input type="hidden" name="favoriteId" value={favoriteId} />
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="pathName" value={pathName} />
      <Button
        type="submit"
        variant="outline"
        size="icon"
        disabled={pending}
        className="bg-primary-foreground"
      >
        <Heart className="h-4 w-4 text-primary" fill="#E21C49" />
      </Button>
    </form>
  );
}
