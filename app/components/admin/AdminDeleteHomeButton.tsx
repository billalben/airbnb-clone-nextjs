"use client";

import { Trash2, Loader2 } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteHome } from "../../actions";

export function AdminDeleteHomeButton({ homeId }: { homeId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      variant="destructive"
      size="xs"
      disabled={pending}
      onClick={() => {
        if (!confirm("Delete this home? This cannot be undone.")) return;
        const formData = new FormData();
        formData.set("homeId", homeId);
        startTransition(async () => {
          try {
            await deleteHome(formData);
          } catch (err) {
            toast.error(
              err instanceof Error ? err.message : "Could not delete home.",
            );
          }
        });
      }}
    >
      {pending ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <Trash2 className="h-3 w-3" />
      )}
      Delete
    </Button>
  );
}
