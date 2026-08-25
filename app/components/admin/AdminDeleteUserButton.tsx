"use client";

import { Trash2, Loader2 } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteUser } from "../../actions";

export function AdminDeleteUserButton({
  userId,
  email,
}: {
  userId: string;
  email: string;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      variant="destructive"
      size="xs"
      disabled={pending}
      onClick={() => {
        if (
          !confirm(
            `Delete user ${email}? This will permanently remove all their homes, reservations, and favorites, plus their images in storage.`,
          )
        )
          return;
        const formData = new FormData();
        formData.set("userId", userId);
        startTransition(async () => {
          try {
            await deleteUser(formData);
            toast.success("User deleted");
          } catch (err) {
            toast.error(
              err instanceof Error ? err.message : "Could not delete user.",
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
