"use client";

import { Button } from "@/components/ui/button";
import { Loader2, Star, Trash2 } from "lucide-react";
import { useState } from "react";
import { deleteHomeImage, setPrimaryImage } from "../../actions";
import Image from "next/image";

export function AdminImageRow({
  homeId,
  imageId,
  isPrimary,
  url,
}: {
  homeId: string;
  imageId: string;
  isPrimary: boolean;
  url: string;
}) {
  const [busy, setBusy] = useState<"primary" | "delete" | null>(null);

  return (
    <div className="flex items-center gap-2">
      <Image
        src={url}
        alt="Home"
        width={40}
        height={40}
        className="h-10 w-10 rounded object-cover"
        unoptimized
      />
      {isPrimary ? (
        <span className="inline-flex items-center gap-1 rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
          <Star className="h-3 w-3" /> Primary
        </span>
      ) : (
        <form
          action={async (fd) => {
            setBusy("primary");
            try {
              await setPrimaryImage(fd);
            } finally {
              setBusy(null);
            }
          }}
        >
          <input type="hidden" name="homeId" value={homeId} />
          <input type="hidden" name="imageId" value={imageId} />
          <Button
            size="xs"
            variant="outline"
            type="submit"
            disabled={busy !== null}
          >
            {busy === "primary" ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Star className="h-3 w-3" />
            )}
            Set primary
          </Button>
        </form>
      )}
      <form
        action={async (fd) => {
          setBusy("delete");
          try {
            await deleteHomeImage(fd);
          } finally {
            setBusy(null);
          }
        }}
      >
        <input type="hidden" name="homeId" value={homeId} />
        <input type="hidden" name="imageId" value={imageId} />
        <Button
          size="xs"
          variant="destructive"
          type="submit"
          disabled={busy !== null}
        >
          {busy === "delete" ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Trash2 className="h-3 w-3" />
          )}
        </Button>
      </form>
    </div>
  );
}
