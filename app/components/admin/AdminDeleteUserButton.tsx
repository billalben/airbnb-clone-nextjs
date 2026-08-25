"use client";

import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
import { deleteUser } from "../../actions";

export function AdminDeleteUserButton({
  userId,
  email,
}: {
  userId: string;
  email: string;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <form
      action={async (fd) => {
        if (
          !confirm(
            `Delete user ${email}? This will permanently remove all their homes, reservations, and favorites, plus their images in storage.`,
          )
        )
          return;
        setBusy(true);
        try {
          await deleteUser(fd);
        } finally {
          setBusy(false);
        }
      }}
    >
      <input type="hidden" name="userId" value={userId} />
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
