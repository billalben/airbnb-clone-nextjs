"use client";

import { Button } from "@/components/ui/button";
import { Loader2, Star, Trash2 } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { deleteHomeImage, setPrimaryImage } from "../../actions";

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
  const [busy, startTransition] = useTransition();
  const busyKind = busy ? "working" : null;

  const runSetPrimary = () => {
    const formData = new FormData();
    formData.set("homeId", homeId);
    formData.set("imageId", imageId);
    startTransition(async () => {
      const result = await setPrimaryImage(formData);
      if (!result.ok) {
        toast.error(result.message ?? "Could not update primary photo.");
        return;
      }
      toast.success("Primary photo updated");
    });
  };

  const runDelete = () => {
    const formData = new FormData();
    formData.set("homeId", homeId);
    formData.set("imageId", imageId);
    startTransition(async () => {
      const result = await deleteHomeImage(formData);
      if (!result.ok) {
        toast.error(result.message ?? "Could not delete photo.");
        return;
      }
      toast.success("Photo removed");
    });
  };

  return (
    <div className="flex items-center gap-2">
      <img
        src={url}
        alt="Home"
        width={40}
        height={40}
        className="h-10 w-10 rounded object-cover"
      />
      {isPrimary ? (
        <span className="inline-flex items-center gap-1 rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
          <Star className="h-3 w-3" /> Primary
        </span>
      ) : (
        <Button
          type="button"
          size="xs"
          variant="outline"
          disabled={busy}
          onClick={runSetPrimary}
        >
          {busyKind === "working" ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Star className="h-3 w-3" />
          )}
          Set primary
        </Button>
      )}
      <Button
        type="button"
        size="xs"
        variant="destructive"
        disabled={busy}
        onClick={runDelete}
      >
        {busyKind === "working" ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Trash2 className="h-3 w-3" />
        )}
      </Button>
    </div>
  );
}
