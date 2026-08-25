"use client";

import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
import { deleteHome } from "../../actions";

export function AdminDeleteHomeButton({ homeId }: { homeId: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <form
      action={async (fd) => {
        if (!confirm("Delete this home? This cannot be undone.")) return;
        setBusy(true);
        try {
          await deleteHome(fd);
        } finally {
          setBusy(false);
        }
      }}
    >
      <input type="hidden" name="homeId" value={homeId} />
      <Button
        type="submit"
        variant="destructive"
        size="xs"
        disabled={busy}
      >
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
