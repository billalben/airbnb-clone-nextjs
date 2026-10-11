"use client";

import { Trash2, Loader2 } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteReservation } from "../../actions";

export function AdminDeleteReservationButton({
  reservationId,
}: {
  reservationId: string;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      variant="destructive"
      size="xs"
      disabled={pending}
      onClick={() => {
        if (!confirm("Delete this reservation?")) return;
        const formData = new FormData();
        formData.set("reservationId", reservationId);
        startTransition(async () => {
          const result = await deleteReservation(formData);
          if (!result.ok) {
            toast.error(result.message ?? "Could not delete reservation.");
            return;
          }
          toast.success("Reservation deleted");
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
