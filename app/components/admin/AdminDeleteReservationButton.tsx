"use client";

import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
import { deleteReservation } from "../../actions";

export function AdminDeleteReservationButton({
  reservationId,
}: {
  reservationId: string;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <form
      action={async (fd) => {
        if (!confirm("Delete this reservation?")) return;
        setBusy(true);
        try {
          await deleteReservation(fd);
        } finally {
          setBusy(false);
        }
      }}
    >
      <input type="hidden" name="reservationId" value={reservationId} />
      <Button type="submit" variant="destructive" size="xs" disabled={busy}>
        {busy ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Trash2 className="h-3 w-3" />
        )}
        Delete
      </Button>
    </form>
  );
}
